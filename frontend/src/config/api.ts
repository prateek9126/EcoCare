/**
 * EcoCare API configuration.
 * Uses VITE_API_URL if configured, otherwise falls back to http://localhost:8080 for local development.
 */
export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
export const API_BASE_URL = `${BACKEND_URL}/api/battery`;
