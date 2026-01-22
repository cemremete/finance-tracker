import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label, 
  error, 
  type = 'text', 
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full px-4 py-2.5 rounded-lg
          bg-card-bg border border-text-muted
          text-text-primary placeholder-text-muted
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
