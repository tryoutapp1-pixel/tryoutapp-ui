// Single shared Axios instance for the whole app.
//
// Base URL: VITE_API_ORIGIN is the API origin only (e.g. http://localhost:3000).
// The backend registers every route under /api (api/src/app.js), so we append
// "/api" exactly once here and all service modules use prefix-less paths such as
// "/auth/login" and "/users/me". This prevents the "/api" double-prefix bug.

import axios from 'axios'
import { getToken, clearToken } from './tokenStorage'
import { toApiError } from './apiError'

const DEFAULT_ORIGIN = 'http://localhost:3000'
const TIMEOUT_MS = 15000 // project convention: 15s

/** @returns {string} The API origin with a single "/api" suffix */
function resolveBaseUrl() {
  const origin = (import.meta.env.VITE_API_ORIGIN || DEFAULT_ORIGIN).trim()
  return `${origin.replace(/\/+$/, '')}/api`
}

// Lightweight event bus so the auth store/router can react to an invalid session
// without creating a circular import between the Axios layer and the store.
/** @type {Set<() => void>} */
const listeners = new Set()

/**
 * Registers a handler that runs when a request fails with 401 while a token
 * is stored.
 * @param {() => void} handler
 * @returns {() => boolean} Unsubscribe function
 */
export function onInvalidSession(handler) {
  listeners.add(handler)
  return () => listeners.delete(handler)
}

/** Calls every invalid-session handler; a throwing handler does not stop the rest. */
function emitInvalidSession() {
  for (const handler of listeners) {
    try {
      handler()
    } catch {
      /* ignore listener errors */
    }
  }
}

const http = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: TIMEOUT_MS,
  headers: { Accept: 'application/json' }
})

// Request interceptor: attach bearer token and content type.
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  // Let the browser set the multipart boundary for FormData uploads.
  if (config.data instanceof FormData) {
    if (config.headers) delete config.headers['Content-Type']
  } else if (config.data !== undefined && config.data !== null) {
    config.headers = config.headers || {}
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
  }

  return config
})

// Response interceptor: normalize errors and surface invalid sessions.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error && error.response && error.response.status
    if (status === 401 && getToken()) {
      clearToken()
      emitInvalidSession()
    }
    return Promise.reject(toApiError(error))
  }
)

/**
 * Unwraps the backend { success, data } envelope. Success/message-only
 * responses (logout, password actions) return the whole payload.
 * @param {import('axios').AxiosResponse} response
 * @returns {any} `data` from the envelope, or the full payload when there is none
 */
export function getEnvelopeData(response) {
  const payload = response && response.data
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data
  }
  return payload
}

export default http
