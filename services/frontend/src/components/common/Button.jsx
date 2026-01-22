import { forwardRef } from 'react'

const variants = {
  primary: 'bg-primary text-background hover:bg-primary-dark',
  secondary: 'bg-card-bg text-text-primary hover:bg-card-hover border border-text-muted',
  ghost: 'bg-transparent text-text-primary hover:bg-card-bg',
  danger: 'bg-danger text-white hover:bg-red-600'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  type = 'button',
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" cy="12" r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none" 
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
          />
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = 'Button'

export default Button
