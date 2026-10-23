// Normalizes any Axios/network error into a safe, user-facing shape.
//
// Backend error envelope (verified in api/src/middlewares/errorHandler.js):
//   { success: false, message, errors? }
// - 400 validation failures include errors: [{ path/param, msg, ... }]
// - 500 responses return a generic "Internal server error" message
//
// We never surface raw 5xx server text, stack traces, tokens, or credentials.

export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN', fieldErrors = {}, raw = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
    this.raw = raw
  }
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'
const TIMEOUT_MESSAGE = 'The request took too long. Please try again.'
const SERVER_MESSAGE = 'The server ran into a problem. Please try again later.'

// Maps express-validator error arrays into a { field: message } object so forms
// can display server-side validation next to the right input.
function mapFieldErrors(errors) {
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

  let code = 'HTTP_ERROR'
  if (status === 400) code = 'VALIDATION'
  else if (status === 401) code = 'UNAUTHORIZED'
  else if (status === 403) code = 'FORBIDDEN'
  else if (status === 404) code = 'NOT_FOUND'
  else if (status === 409) code = 'CONFLICT'

  return new ApiError({ message, status, code, fieldErrors, raw: error })
}
