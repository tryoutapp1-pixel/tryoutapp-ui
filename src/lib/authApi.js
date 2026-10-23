import { api, getEnvelopeData } from './api'
import { ApiError } from './apiError'

function successBody(response) {
  const body = response?.data
  if (!body || typeof body !== 'object' || body.success !== true) {
    throw new ApiError('Respons server tidak sesuai format yang diharapkan.', { code: 'API_CONTRACT_ERROR' })
  }
  return body
}

export async function signUp(payload) {
  const response = await api.post('/auth/signup', payload)
  const body = successBody(response)
  return { data: getEnvelopeData(response), message: body.message }
}

export async function verifyEmail(token) {
  const response = await api.get('/auth/verify-email', { params: { token } })
  return successBody(response).message
}

export async function resendVerification(email) {
  const response = await api.post('/auth/resend-verification', { email })
  return successBody(response).message
}

export async function requestPasswordReset(email) {
  const response = await api.post('/auth/forgot-password', { email })
  return successBody(response).message
}

export async function resetPassword(token, newPassword) {
  const response = await api.post('/auth/reset-password', { token, newPassword })
  return successBody(response).message
}
