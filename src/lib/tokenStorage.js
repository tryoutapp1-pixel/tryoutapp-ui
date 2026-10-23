const TOKEN_KEY = 'tryout.accessToken'

// Isolated so the owner can switch persistence policy without changing API/store code.
export const tokenStorage = {
  get() {
    return window.sessionStorage.getItem(TOKEN_KEY)
  },
  set(token) {
    window.sessionStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    window.sessionStorage.removeItem(TOKEN_KEY)
  },
}
