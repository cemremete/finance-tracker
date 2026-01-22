// form validation rules for react-hook-form

export const emailRules = {
  required: 'Email is required',
  pattern: {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: 'Invalid email address'
  }
}

export const passwordRules = {
  required: 'Password is required',
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters'
  }
}

export const confirmPasswordRules = (getValues) => ({
  required: 'Please confirm your password',
  validate: (value) => value === getValues('password') || 'Passwords do not match'
})

export const nameRules = {
  required: 'This field is required',
  minLength: {
    value: 2,
    message: 'Must be at least 2 characters'
  },
  maxLength: {
    value: 50,
    message: 'Must be less than 50 characters'
  }
}

export const termsRules = {
  required: 'You must accept the terms and conditions'
}
