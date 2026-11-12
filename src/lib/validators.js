// Reusable vee-validate rule functions. Mirror backend constraints
// (api/src/validators/authValidators.js, userValidators.js) so the client gives
// immediate feedback; the server remains authoritative.

/**
 * A validation rule: returns true when valid, otherwise the error message.
 * @typedef {(value: any) => true|string} Rule
 */

/**
 * @param {string} [label='This field'] - Field name used in the message
 * @returns {Rule}
 */
export function required(label = 'This field') {
  return (value) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return `${label} is required`
    }
    return true
  }
}

/**
 * @param {any} value
 * @returns {true|string}
 */
export function email(value) {
  if (!value) return 'Email is required'
  // Simple, permissive email shape check; backend normalizes/validates.
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
  return ok || 'Enter a valid email address'
}

/**
 * Fails on an empty value as well as a short one.
 * @param {number} n - Minimum length
 * @param {string} [label='This field']
 * @returns {Rule}
 */
export function minLength(n, label = 'This field') {
  return (value) => {
    if (!value) return `${label} is required`
    return String(value).length >= n || `${label} must be at least ${n} characters`
  }
}

/**
 * An empty value passes.
 * @param {number} n - Maximum length
 * @param {string} [label='This field']
 * @returns {Rule}
 */
export function maxLength(n, label = 'This field') {
  return (value) => {
    if (!value) return true
    return String(value).length <= n || `${label} must be at most ${n} characters`
  }
}

// Backend password minimum is 8 characters.
/** @type {Rule} */
export const password = minLength(8, 'Password')

/**
 * Passes when the value strictly equals the current value from `getter`.
 * @param {() => unknown} getter - Reads the value to compare against, e.g. the password field
 * @param {string} [message='Values do not match']
 * @returns {Rule}
 */
export function matches(getter, message = 'Values do not match') {
  return (value) => value === getter() || message
}

/**
 * Composes multiple rules; returns the first failure message.
 * @param {...Rule} rules
 * @returns {Rule}
 */
export function compose(...rules) {
  return (value) => {
    for (const rule of rules) {
      const result = rule(value)
      if (result !== true) return result
    }
    return true
  }
}
