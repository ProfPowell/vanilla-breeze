# Add OAuth Command

Scaffold OAuth provider integration for social login.

## Usage

```
/add-oauth [provider]
```

## Arguments

- `$ARGUMENTS` - OAuth provider
  - `google` - Google OAuth 2.0
  - `github` - GitHub OAuth
  - `generic` - Generic OAuth 2.0 template

## Examples

```
/add-oauth google
/add-oauth github
/add-oauth generic
```

## Steps to Execute

### 1. Generate OAuth Configuration

Add to `src/config/index.js`:

```javascript
oauth: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || '/api/auth/callback/google'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: process.env.GITHUB_CALLBACK_URL || '/api/auth/callback/github'
  }
}
```

### 2. Generate OAuth Service

Create or update `src/services/oauth.js`:

```javascript
// src/services/oauth.js
import { config } from '../config/index.js';
import { query } from '../db/client.js';
import { generateAccessToken, generateRefreshToken } from '../lib/auth.js';

const providers = {
  google: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scopes: ['openid', 'email', 'profile']
  },
  github: {
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailUrl: 'https://api.github.com/user/emails',
    scopes: ['user:email']
  }
};

/**
 * Generate OAuth authorization URL
 * @param {string} provider - Provider name
 * @param {string} state - CSRF state token
 * @returns {string}
 */
export function getAuthUrl(provider, state) {
  const providerConfig = providers[provider];
  const oauthConfig = config.oauth[provider];

  if (!providerConfig || !oauthConfig) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: `${config.appUrl}${oauthConfig.callbackUrl}`,
    response_type: 'code',
    scope: providerConfig.scopes.join(' '),
    state
  });

  return `${providerConfig.authUrl}?${params}`;
}

/**
 * Exchange authorization code for tokens
 * @param {string} provider
 * @param {string} code
 * @returns {Promise<object>}
 */
export async function exchangeCode(provider, code) {
  const providerConfig = providers[provider];
  const oauthConfig = config.oauth[provider];

  const response = await fetch(providerConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${config.appUrl}${oauthConfig.callbackUrl}`
    })
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

/**
 * Get user info from provider
 * @param {string} provider
 * @param {string} accessToken
 * @returns {Promise<{ email: string, name: string, providerId: string }>}
 */
export async function getUserInfo(provider, accessToken) {
  const providerConfig = providers[provider];

  const response = await fetch(providerConfig.userInfoUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const data = await response.json();

  // Normalize response
  if (provider === 'google') {
    return {
      email: data.email,
      name: data.name,
      providerId: data.id
    };
  }

  if (provider === 'github') {
    // GitHub may not include email in profile
    let email = data.email;
    if (!email) {
      const emailResponse = await fetch(providerConfig.emailUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const emails = await emailResponse.json();
      email = emails.find(e => e.primary)?.email || emails[0]?.email;
    }

    return {
      email,
      name: data.name || data.login,
      providerId: String(data.id)
    };
  }

  return data;
}

/**
 * Find or create user from OAuth
 * @param {string} provider
 * @param {{ email: string, name: string, providerId: string }} userInfo
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
 */
export async function findOrCreateUser(provider, userInfo) {
  // Check for existing user by email
  let { rows } = await query(
    'SELECT id, email, name, role FROM users WHERE email = $1',
    [userInfo.email.toLowerCase()]
  );

  let user;

  if (rows.length === 0) {
    // Create new user
    const result = await query(`
      INSERT INTO users (email, name, password_hash, email_verified, oauth_provider, oauth_id)
      VALUES ($1, $2, '', TRUE, $3, $4)
      RETURNING id, email, name, role
    `, [userInfo.email.toLowerCase(), userInfo.name, provider, userInfo.providerId]);

    user = result.rows[0];
  } else {
    user = rows[0];

    // Update OAuth info if not set
    await query(`
      UPDATE users
      SET oauth_provider = COALESCE(oauth_provider, $1),
          oauth_id = COALESCE(oauth_id, $2),
          last_login_at = NOW()
      WHERE id = $3
    `, [provider, userInfo.providerId, user.id]);
  }

  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ sub: user.id });

  return { user, accessToken, refreshToken };
}
```

### 3. Generate OAuth Handlers

Add to `src/api/handlers/auth.js`:

```javascript
import crypto from 'crypto';
import * as oauthService from '../../services/oauth.js';

// Store state tokens (use Redis in production)
const stateTokens = new Map();

/**
 * GET /api/auth/oauth/:provider
 * Redirect to OAuth provider
 */
export async function oauthRedirect(req, res) {
  const { provider } = req.params;

  // Generate state token for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  stateTokens.set(state, { provider, createdAt: Date.now() });

  // Clean old states (older than 10 minutes)
  const now = Date.now();
  for (const [key, value] of stateTokens) {
    if (now - value.createdAt > 600000) {
      stateTokens.delete(key);
    }
  }

  const authUrl = oauthService.getAuthUrl(provider, state);
  res.redirect(authUrl);
}

/**
 * GET /api/auth/callback/:provider
 * Handle OAuth callback
 */
export async function oauthCallback(req, res) {
  const { provider } = req.params;
  const { code, state, error } = req.query;

  // Check for OAuth error
  if (error) {
    return res.redirect(`/login?error=${encodeURIComponent(error)}`);
  }

  // Validate state token
  const stateData = stateTokens.get(state);
  if (!stateData || stateData.provider !== provider) {
    return res.redirect('/login?error=invalid_state');
  }
  stateTokens.delete(state);

  try {
    // Exchange code for tokens
    const tokens = await oauthService.exchangeCode(provider, code);

    // Get user info
    const userInfo = await oauthService.getUserInfo(provider, tokens.access_token);

    // Find or create user
    const result = await oauthService.findOrCreateUser(provider, userInfo);

    // Redirect with tokens (or set cookies for session-based)
    const params = new URLSearchParams({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });

    res.redirect(`/auth/callback?${params}`);
  } catch (err) {
    console.error('OAuth error:', err);
    res.redirect('/login?error=oauth_failed');
  }
}
```

### 4. Add Routes

Add to `src/api/routes.js`:

```javascript
// OAuth routes
app.get('/api/auth/oauth/:provider', authHandlers.oauthRedirect);
app.get('/api/auth/callback/:provider', authHandlers.oauthCallback);
```

### 5. Update Users Migration

Add OAuth columns if not present:

```javascript
// Add to existing users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_users_oauth
ON users(oauth_provider, oauth_id)
WHERE oauth_provider IS NOT NULL;
```

### 6. Update .env.example

```bash
# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=/api/auth/callback/google

# OAuth - GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=/api/auth/callback/github

# App URL (for OAuth redirects)
APP_URL=http://localhost:3000
```

### 7. Output Summary

```
OAuth integration added for: {provider}

Files created/updated:
  src/config/index.js          # OAuth configuration
  src/services/oauth.js        # OAuth service
  src/api/handlers/auth.js     # OAuth handlers

Routes added:
  GET /api/auth/oauth/{provider}     # Redirect to provider
  GET /api/auth/callback/{provider}  # Handle callback

Setup steps:
1. Create OAuth app at provider's developer console
2. Set redirect URI to: {app_url}/api/auth/callback/{provider}
3. Add credentials to .env:
   {PROVIDER}_CLIENT_ID=your-client-id
   {PROVIDER}_CLIENT_SECRET=your-client-secret
4. Run migration for OAuth columns (if needed)

Frontend usage:
  <a href="/api/auth/oauth/{provider}">Login with {Provider}</a>
```

## Provider-Specific Setup

### Google

1. Go to https://console.cloud.google.com/
2. Create project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI

### GitHub

1. Go to https://github.com/settings/developers
2. Create new OAuth App
3. Set callback URL
4. Copy Client ID and Secret

## Notes

- State tokens prevent CSRF attacks
- Users can link multiple OAuth providers
- Email is used to match existing accounts
- Password is empty for OAuth-only users
- Use Redis for state tokens in production
