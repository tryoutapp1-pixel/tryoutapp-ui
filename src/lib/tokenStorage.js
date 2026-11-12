// Token storage adapter.
//
// Project decision (see docs/frontend-foundation.md): the access token is kept
// in sessionStorage. It clears when the browser session ends. The backend JWT
// currently has no expiry/refresh/revocation, so we do not invent expiry
// handling here. Never store passwords or other sensitive form values here.

const TOKEN_KEY = 'tryout.accessToken'

/** @returns {Storage|null} sessionStorage, or null when the browser blocks it */
function safeStorage() {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/** @returns {string|null} The stored access token, or null */
export function getToken() {
  const storage = safeStorage()
  if (!storage) return null
  try {
    return storage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/**
 * Stores the token, or removes it when `token` is empty. Write failures are
 * ignored.
 * @param {string|null|undefined} token
 */
export function setToken(token) {
  const storage = safeStorage()
  if (!storage) return
  try {
    if (token) storage.setItem(TOKEN_KEY, token)
    else storage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore storage write failures */
  }
}

export function clearToken() {
  setToken(null)
}
