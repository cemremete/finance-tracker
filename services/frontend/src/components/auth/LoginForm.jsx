import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button, Input, Checkbox } from '../common'
import { useAuth } from '../../context/AuthContext'
import { emailRules, passwordRules } from '../../utils/validators'

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    const result = await login(data.email, data.password)
    setIsLoading(false)

    if (result.success) {
      navigate(from, { replace: true })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-danger/20 border border-danger rounded-lg p-4 text-danger text-sm">
          {error}
        </div>
      )}

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

      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          {...register('rememberMe')}
        />
        <Link 
          to="/forgot-password" 
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        loading={isLoading}
      >
        Sign In
      </Button>

      <p className="text-center text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:text-primary-dark transition-colors">
          Create one
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
