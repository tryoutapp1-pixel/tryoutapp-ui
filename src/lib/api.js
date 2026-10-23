import axios from 'axios'
import { tokenStorage } from './tokenStorage'
import { notify, toApiError } from './apiError'

const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.trim() || 'http://localhost:3000'
const apiOrigin = configuredOrigin.replace(/\/+$/, '')
const publicPaths = new Set([
  'auth/login',
  'auth/signup',
  'auth/verify-email',
  'auth/resend-verification',
  'auth/forgot-password',
  'auth/reset-password',
  'payments/midtrans/notification',
])

export const apiBaseURL = `${apiOrigin}/api`
export const api = axios.create({
  baseURL: apiBaseURL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
  config.headers = config.headers || {}
  if (isFormData) {
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  } else if (config.data !== undefined) {
    config.headers['Content-Type'] = 'application/json'
  }

  const requestPath = String(config.url || '').replace(/^\/+/, '')
  const isPublicRequest = publicPaths.has(requestPath.split('?')[0])
  const token = tokenStorage.get()
  if (token && !isPublicRequest) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = toApiError(error)
    if (normalized.status === 401 && tokenStorage.get()) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('auth:invalid-session'))
    }
    error.apiError = normalized
    if (!normalized.validationErrors.length && normalized.status !== 401 && normalized.status !== 403) {
      notify(normalized.message)
    }
    return Promise.reject(normalized)
  },
)

export function getEnvelopeData(response) {
  const body = response?.data
  if (!body || typeof body !== 'object' || body.success !== true || !('data' in body)) {
    throw new Error('Respons server tidak sesuai format yang diharapkan.')
  }
  return body.data
}
