import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BudgetPage from './pages/BudgetPage'
import GoalsPage from './pages/GoalsPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import ProtectedRoute from './utils/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/transactions" 
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/budget" 
        element={
          <ProtectedRoute>
            <BudgetPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/goals" 
        element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subscriptions" 
        element={
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App
