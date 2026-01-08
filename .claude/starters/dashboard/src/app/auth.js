/**
 * Authentication Module
 * Handles login, logout, and token management
 */

import { api } from './api.js';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {string[]} roles
 */

class Auth {
  constructor() {
    /** @type {string|null} */
    this.token = localStorage.getItem(TOKEN_KEY);
    /** @type {User|null} */
    this.user = this.loadUser();
  }

  /**
   * Load user from storage
   * @returns {User|null}
   */
  loadUser() {
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    if (!this.token) return false;

    // Check token expiration
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.logout();
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Login with credentials
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>}
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });

    if (!response.token || !response.user) {
      throw new Error('Invalid response from server');
    }

    this.token = response.token;
    this.user = response.user;

    localStorage.setItem(TOKEN_KEY, this.token);
    localStorage.setItem(USER_KEY, JSON.stringify(this.user));

    // Update API with token
    api.setAuthToken(this.token);

    return this.user;
  }

  /**
   * Logout and clear session
   */
  logout() {
    this.token = null;
    this.user = null;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    api.setAuthToken(null);

    document.dispatchEvent(new CustomEvent('auth:logout'));
  }

  /**
   * Get current user
   * @returns {User|null}
   */
  getUser() {
    return this.user;
  }

  /**
   * Get auth token
   * @returns {string|null}
   */
  getToken() {
    return this.token;
  }

  /**
   * Check if user has a role
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(role) {
    return this.user?.roles?.includes(role) ?? false;
  }

  /**
   * Refresh the auth token
   * @returns {Promise<void>}
   */
  async refresh() {
    if (!this.token) return;

    try {
      const response = await api.post('/auth/refresh');
      if (response.token) {
        this.token = response.token;
        localStorage.setItem(TOKEN_KEY, this.token);
        api.setAuthToken(this.token);
      }
    } catch {
      this.logout();
    }
  }
}

export const auth = new Auth();

// Set initial token for API
if (auth.token) {
  api.setAuthToken(auth.token);
}
