<script setup>
// vee-validate field bound to a Vuetify text field. Keeps per-field validation
// consistent across the app and lets a parent inject a server-side error
// message (e.g. from a 400 response) via :serverError.
import { toRef, watch } from 'vue'
import { useField } from 'vee-validate'

/**
 * @typedef {Object} AppTextFieldProps
 * @property {string} name - vee-validate field name
 * @property {string} [label]
 * @property {string} [type] - Input type
 * @property {Function|Object|string} [rules] - vee-validate rules
 * @property {string} [autocomplete]
 * @property {string} [serverError] - Server-side error shown until the user edits the field
 */

/** @type {AppTextFieldProps} */
const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  rules: { type: [Function, Object, String], default: undefined },
  autocomplete: { type: String, default: undefined },
  serverError: { type: String, default: '' }
})

const nameRef = toRef(props, 'name')
const { value, errorMessage, setErrors, handleBlur } = useField(nameRef, props.rules, {
  label: props.label
})

// Surface a server-provided error until the user edits the field again.
watch(
  () => props.serverError,
  (msg) => {
    if (msg) setErrors(msg)
  }
)
</script>

<template>
  <v-text-field
    v-model="value"
    :label="label"
    :type="type"
    :autocomplete="autocomplete"
    :error-messages="errorMessage ? [errorMessage] : []"
    @blur="handleBlur"
  />
</template>
