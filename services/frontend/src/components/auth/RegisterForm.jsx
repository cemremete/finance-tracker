import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Input, Checkbox } from '../common'
import { useAuth } from '../../context/AuthContext'
import { 
  emailRules, 
  passwordRules, 
  confirmPasswordRules, 
  nameRules,
  termsRules 
} from '../../utils/validators'

function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser, error } = useAuth()
  const navigate = useNavigate()

  const { 
    register, 
    handleSubmit, 
    getValues,
    formState: { errors } 
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    const result = await registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password
    })
    setIsLoading(false)

    if (result.success) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-danger/20 border border-danger rounded-lg p-4 text-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          placeholder="John"
          error={errors.firstName?.message}
          {...register('firstName', nameRules)}
        />
        <Input
          label="Last Name"
          placeholder="Doe"
          error={errors.lastName?.message}
          {...register('lastName', nameRules)}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email', emailRules)}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', passwordRules)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-text-muted hover:text-text-primary transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <div className="relative">
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', confirmPasswordRules(getValues))}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-text-muted hover:text-text-primary transition-colors"
        >
          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      <Checkbox
        label={
          <>
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:text-primary-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:text-primary-dark">
              Privacy Policy
            </Link>
          </>
        }
        error={errors.terms?.message}
        {...register('terms', termsRules)}
      />

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        loading={isLoading}
      >
        Create Account
      </Button>

      <p className="text-center text-text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:text-primary-dark transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export default RegisterForm
