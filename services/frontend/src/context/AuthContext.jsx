import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken')
      
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await authApi.getProfile()
        setUser(response.data.user)
      } catch (err) {
        // token invalid or expired
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    setError(null)
    try {
      const response = await authApi.login({ email, password })
      const { user, accessToken, refreshToken } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)

      return { success: true }
    } catch (err) {
      let message = 'Login failed'
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
        message = 'Cannot connect to server. Please ensure the backend is running.'
      } else if (err.response?.status === 401) {
        message = 'Invalid email or password'
      } else if (err.response?.status === 423) {
        message = 'Account is locked. Please try again later.'
      } else if (err.response?.data?.message) {
        message = err.response.data.message
      }
      
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (data) => {
    setError(null)
    try {
      const response = await authApi.register(data)
      const { user, accessToken, refreshToken } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)

      return { success: true }
    } catch (err) {
      let message = 'Registration failed'
      
      if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
        message = 'Cannot connect to server. Please ensure the backend is running.'
      } else if (err.response?.status === 409) {
        message = 'Email already registered'
      } else if (err.response?.data?.message) {
        message = err.response.data.message
      }
      
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (err) {
      // ignore logout errors
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
