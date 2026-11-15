<script setup>
// Password field with a show/hide toggle. The visibility flag is local UI
// state only (never stored). Uses vee-validate like AppTextField.
import { ref, toRef, watch } from 'vue'
import { useField } from 'vee-validate'

/**
 * @typedef {Object} AppPasswordFieldProps
 * @property {string} name - vee-validate field name
 * @property {string} [label]
 * @property {Function|Object|string} [rules] - vee-validate rules
 * @property {string} [autocomplete]
 * @property {string} [serverError] - Server-side error shown on the field
 */

/** @type {AppPasswordFieldProps} */
const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: 'Kata sandi' },
  rules: { type: [Function, Object, String], default: undefined },
  autocomplete: { type: String, default: 'current-password' },
  serverError: { type: String, default: '' }
})

const show = ref(false)
const nameRef = toRef(props, 'name')
const { value, errorMessage, setErrors, handleBlur } = useField(nameRef, props.rules, {
  label: props.label
})

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
    :type="show ? 'text' : 'password'"
    :autocomplete="autocomplete"
    :append-inner-icon="show ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
    :error-messages="errorMessage ? [errorMessage] : []"
    @click:append-inner="show = !show"
    @blur="handleBlur"
  />
</template>
