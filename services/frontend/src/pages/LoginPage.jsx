import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import LoginForm from '../components/auth/LoginForm'

function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card-bg p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-background" />
          </div>
          <span className="text-xl font-bold text-text-primary">Finance Tracker</span>
        </Link>

        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Welcome back
          </h1>
          <p className="text-text-secondary text-lg">
            Sign in to continue tracking your finances and reaching your goals.
          </p>
        </div>

        <p className="text-text-muted text-sm">
          © 2024 Finance Tracker. All rights reserved.
        </p>
      </div>

      {/* right side - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-background" />
              </div>
              <span className="text-xl font-bold text-text-primary">Finance Tracker</span>
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Sign in to your account</h2>
            <p className="text-text-secondary">Enter your credentials to access your dashboard</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}

export default LoginPage
