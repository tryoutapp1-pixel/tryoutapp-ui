// Normalizes any Axios/network error into a safe, user-facing shape.
//
// Backend error envelope (verified in api/src/middlewares/errorHandler.js):
//   { success: false, message, errors? }
// - 400 validation failures include errors: [{ path/param, msg, ... }]
// - 500 responses return a generic "Internal server error" message
//
// We never surface raw 5xx server text, stack traces, tokens, or credentials.

/**
 * @typedef {'UNKNOWN'|'TIMEOUT'|'NETWORK'|'SERVER'|'HTTP_ERROR'|'VALIDATION'|'UNAUTHORIZED'|'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'} ApiErrorCode
 */

/** @typedef {Record<string, string>} FieldErrors - Field name to first server message */

/**
 * @typedef {Object} ApiErrorInit
 * @property {string} message - Safe, user-facing message
 * @property {number} [status=0] - HTTP status; 0 when there was no response
 * @property {ApiErrorCode} [code='UNKNOWN']
 * @property {FieldErrors} [fieldErrors={}]
 * @property {unknown} [raw=null] - The original error, for debugging only
 */

export class ApiError extends Error {
  /** @param {ApiErrorInit} init */
  constructor({ message, status = 0, code = 'UNKNOWN', fieldErrors = {}, raw = null }) {
    super(message)
    this.name = 'ApiError'
    /** @type {number} */
    this.status = status
    /** @type {ApiErrorCode} */
    this.code = code
    /** @type {FieldErrors} */
    this.fieldErrors = fieldErrors
    /** @type {unknown} */
    this.raw = raw
  }
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const TIMEOUT_MESSAGE = 'The request took too long. Please try again.'
const SERVER_MESSAGE = 'The server ran into a problem. Please try again later.'

/**
 * Maps express-validator error arrays into a { field: message } object so forms
 * can display server-side validation next to the right input. Keeps the first
 * message per field.
 * @param {unknown} errors - `errors` from the backend envelope
 * @returns {FieldErrors}
 */
function mapFieldErrors(errors) {
  /** @type {FieldErrors} */
  const fieldErrors = {}
  if (!Array.isArray(errors)) return fieldErrors
  for (const item of errors) {
    if (!item) continue
    const field = item.path || item.param
    const message = item.msg || item.message
    if (field && message && !fieldErrors[field]) {
      fieldErrors[field] = message
    }
  }
  return fieldErrors
}

/**
 * Converts any thrown value into an ApiError. An existing ApiError is
 * returned unchanged.
 * @param {any} error - Usually an Axios error; may be a network failure or an ApiError
 * @returns {ApiError}
 */
export function toApiError(error) {
  if (error instanceof ApiError) return error

  // No HTTP response: network failure, timeout, or request cancellation.
  if (!error || !error.response) {
    if (error && error.code === 'ECONNABORTED') {
      return new ApiError({ message: TIMEOUT_MESSAGE, code: 'TIMEOUT', raw: error })
    }
    return new ApiError({ message: NETWORK_MESSAGE, code: 'NETWORK', raw: error })
  }

  const { status, data } = error.response

  // Hide internal details for server errors.
  if (status >= 500) {
    return new ApiError({ message: SERVER_MESSAGE, status, code: 'SERVER', raw: error })
  }

  const fieldErrors = mapFieldErrors(data && data.errors)
  const message =
    (data && typeof data.message === 'string' && data.message) ||
    (status === 401 && 'Your session is invalid. Please sign in again.') ||
    (status === 403 && 'You do not have access to this resource.') ||
    (status === 404 && 'The requested resource was not found.') ||
    GENERIC_MESSAGE

  /** @type {ApiErrorCode} */
  let code = 'HTTP_ERROR'
  if (status === 400) code = 'VALIDATION'
  else if (status === 401) code = 'UNAUTHORIZED'
  else if (status === 403) code = 'FORBIDDEN'
  else if (status === 404) code = 'NOT_FOUND'
  else if (status === 409) code = 'CONFLICT'

  return new ApiError({ message, status, code, fieldErrors, raw: error })
}
