export class ApiError extends Error {
  constructor(message, { status = null, validationErrors = [], code = 'API_ERROR' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.validationErrors = validationErrors
    this.code = code
  }
}

export function toApiError(error) {
  if (error instanceof ApiError) return error
  if (!error?.response) {
    return new ApiError('Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.', {
      code: 'NETWORK_ERROR',
    })
  }

  const { status, data } = error.response
  const validationErrors = Array.isArray(data?.errors)
    ? data.errors.map((item) => ({ field: item.path || item.param, message: item.msg }))
    : []
  const message = status >= 500
    ? 'Layanan sedang mengalami kendala. Silakan coba lagi.'
    : typeof data?.message === 'string'
      ? data.message
      : 'Permintaan tidak dapat diproses.'

  return new ApiError(message, { status, validationErrors, code: 'HTTP_ERROR' })
}

export function notify(message, color = 'error') {
  window.dispatchEvent(new CustomEvent('app:notice', { detail: { message, color } }))
}
