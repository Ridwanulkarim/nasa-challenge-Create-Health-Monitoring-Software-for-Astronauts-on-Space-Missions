/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Client API Service: client/src/services/api.js
 */

const API_BASE = '/api';

export const api = {
  getToken() {
    return localStorage.getItem('astro_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('astro_token', token);
    } else {
      localStorage.removeItem('astro_token');
    }
  },

  removeToken() {
    localStorage.removeItem('astro_token');
    localStorage.removeItem('astro_user');
  },

  getUser() {
    try {
      const u = localStorage.getItem('astro_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setUser(user) {
    if (user) {
      localStorage.setItem('astro_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('astro_user');
    }
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let response;
    try {
      response = await fetch(url, { ...config, signal: controller.signal });
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Spacecraft link timeout. Switch to Autonomous Simulation Mode.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 401 && !url.includes('/auth/login')) {
      this.removeToken();
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/';
      }
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async login(credentials) {
    const res = await this.post('/auth/login', credentials);
    if (res.token && res.user) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  logout() {
    this.removeToken();
  }
};

export default api;
