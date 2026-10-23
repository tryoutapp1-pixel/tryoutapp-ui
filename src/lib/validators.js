// Reusable vee-validate rule functions. Mirror backend constraints
// (api/src/validators/authValidators.js, userValidators.js) so the client gives
// immediate feedback; the server remains authoritative.

export function required(label = 'This field') {
  return (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${label} is required`
    }
    return true
  }
}

export function email(value) {
  if (!value) return 'Email is required'
  // Simple, permissive email shape check; backend normalizes/validates.
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
  return ok || 'Enter a valid email address'
}

export function minLength(n, label = 'This field') {
  return (value) => {
    if (!value) return `${label} is required`
    return String(value).length >= n || `${label} must be at least ${n} characters`
  }
}

export function maxLength(n, label = 'This field') {
  return (value) => {
    if (!value) return true
    return String(value).length <= n || `${label} must be at most ${n} characters`
  }
}

// Backend password minimum is 8 characters.
export const password = minLength(8, 'Password')

export function matches(getter, message = 'Values do not match') {
  return (value) => value === getter() || message
}

// Compose multiple rules; returns the first failure message.
export function compose(...rules) {
  return (value) => {
    for (const rule of rules) {
      const result = rule(value)
      if (result !== true) return result
    }
    return true
  }
}
