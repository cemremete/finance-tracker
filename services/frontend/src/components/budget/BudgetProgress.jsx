import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '../common'
import { transactionApi } from '../../services/transactionApi'

function BudgetProgress() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudgets()
  }, [])

  const loadBudgets = async () => {
    try {
      const response = await transactionApi.getBudgetProgress()
      setBudgets(response.data)
    } catch (err) {
      console.error('Failed to load budgets:', err)
      // Use mock data if service unavailable
      setBudgets([
        { id: '1', category: 'food', limit: 3000, spent: 2450, remaining: 550, percentageUsed: 81.7, status: 'warning' },
        { id: '2', category: 'transport', limit: 1000, spent: 650, remaining: 350, percentageUsed: 65, status: 'healthy' },
        { id: '3', category: 'entertainment', limit: 500, spent: 480, remaining: 20, percentageUsed: 96, status: 'critical' },
        { id: '4', category: 'shopping', limit: 2000, spent: 1200, remaining: 800, percentageUsed: 60, status: 'healthy' }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-card-hover rounded-lg"></div>
          ))}
        </div>
      </Card>
    )
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Budget Progress</h3>
        <p className="text-text-muted text-center py-8">No budgets set. Create one to track spending!</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Budget Progress</h3>
      <div className="space-y-4">
        {budgets.map((budget) => (
          <BudgetBar key={budget.id} budget={budget} />
        ))}
      </div>
    </Card>
  )
}

function BudgetBar({ budget }) {
  const { category, limit, spent, remaining, percentageUsed, status } = budget

  const getStatusConfig = () => {
    switch (status) {
      case 'exceeded':
        return { color: '#EF4444', bgColor: '#EF444420', icon: XCircle, label: 'Over budget!' }
      case 'critical':
        return { color: '#F59E0B', bgColor: '#F59E0B20', icon: AlertTriangle, label: '90%+ used' }
      case 'warning':
        return { color: '#EAB308', bgColor: '#EAB30820', icon: AlertTriangle, label: '80%+ used' }
      default:
        return { color: '#22C55E', bgColor: '#22C55E20', icon: CheckCircle, label: 'On track' }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon
  const displayPercentage = Math.min(percentageUsed, 100)

  return (
    <div className="p-3 bg-card-hover rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary capitalize">{category}</span>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <span className="text-xs text-text-muted">
          {spent.toLocaleString()}₺ / {limit.toLocaleString()}₺
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-background rounded-full overflow-hidden mb-2">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${displayPercentage}%`,
            backgroundColor: config.color
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span style={{ color: config.color }}>{percentageUsed.toFixed(0)}% used</span>
        <span className="text-text-muted">
          {status === 'exceeded' 
            ? `${(spent - limit).toLocaleString()}₺ over` 
            : `${remaining.toLocaleString()}₺ left`
          }
        </span>
      </div>
    </div>
  )
}

export default BudgetProgress
