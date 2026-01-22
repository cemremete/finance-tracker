import { forwardRef } from 'react'

const Checkbox = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className={className}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className="
            mt-0.5 h-4 w-4 rounded
            border-text-muted bg-card-bg
            text-primary focus:ring-primary focus:ring-offset-background
            cursor-pointer
          "
          {...props}
        />
        <span className="text-sm text-text-secondary">{label}</span>
      </label>
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  )
})

Checkbox.displayName = 'Checkbox'

export default Checkbox
