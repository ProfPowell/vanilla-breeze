# Dashboard Starter

Admin interface with sidebar navigation, data tables, and optional charts.

## Features

- Sidebar navigation with collapsible menu
- JWT/session/OAuth authentication
- Data tables with sorting and filtering
- Stat cards for key metrics
- Optional chart integration
- Responsive design
- Light/dark theme support

## Structure

```
[project]/
├── index.html              # Login redirect
├── login.html              # Login page
├── app.html                # Dashboard shell
├── manifest.json
├── src/
│   ├── app/
│   │   ├── main.js         # Entry point
│   │   ├── router.js       # Client router
│   │   ├── auth.js         # Authentication
│   │   └── api.js          # API client
│   ├── views/
│   │   ├── dashboard-view.js
│   │   ├── settings-view.js
│   │   ├── list-view.js
│   │   └── detail-view.js
│   ├── components/
│   │   ├── dashboard-layout.js
│   │   ├── sidebar-nav.js
│   │   ├── data-table.js
│   │   ├── stat-card.js
│   │   └── chart-wrapper.js
│   └── styles/
│       ├── main.css
│       └── _dashboard.css
└── package.json
```

## Prompts

| Key | Description | Default |
|-----|-------------|---------|
| `PROJECT_NAME` | Folder name | (required) |
| `DISPLAY_NAME` | Display name | (required) |
| `DESCRIPTION` | Description | (required) |
| `API_BASE_URL` | API base URL | `/api` |
| `AUTH_TYPE` | Auth type (jwt/session/oauth) | `jwt` |
| `INITIAL_VIEWS` | Views to create | `dashboard,settings,list,detail` |
| `ENABLE_CHARTS` | Include charts | `true` |
| `SIDEBAR_POSITION` | Sidebar side | `left` |
| `THEME_COLOR` | Theme color | `#1e40af` |

## Usage

1. Run `/scaffold-dashboard` command
2. Answer prompts
3. Files are generated in your project

## Authentication Flow

1. User visits `index.html`
2. If not authenticated, redirected to `login.html`
3. After login, token stored and redirected to `app.html`
4. API requests include token in Authorization header

## Components

### dashboard-layout

Main layout with sidebar and content area.

```html
<dashboard-layout sidebar="left">
  <sidebar-nav slot="sidebar"></sidebar-nav>
  <main slot="content">
    <!-- View content -->
  </main>
</dashboard-layout>
```

### data-table

Sortable, filterable data table.

```html
<data-table
  columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"}]'
  data-src="/api/users">
</data-table>
```

### stat-card

Metric display card.

```html
<stat-card
  label="Total Users"
  value="1,234"
  trend="+12%"
  icon="users">
</stat-card>
```
