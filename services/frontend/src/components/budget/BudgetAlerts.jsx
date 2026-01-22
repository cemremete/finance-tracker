import { useState, useEffect } from 'react'
import { AlertTriangle, X, Bell } from 'lucide-react'
import { transactionApi } from '../../services/transactionApi'

function BudgetAlerts() {
  const [alerts, setAlerts] = useState([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    loadAlerts()
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await transactionApi.getBudgetAlerts()
      setAlerts(response.data)
    } catch (err) {
      console.error('Failed to load alerts:', err)
    }
  }

  const dismissAlert = async (alertId) => {
    try {
      await transactionApi.markAlertsRead([alertId])
      setAlerts(alerts.filter(a => a.id !== alertId))
    } catch (err) {
      console.error('Failed to dismiss alert:', err)
    }
  }

  const dismissAll = async () => {
    try {
      await transactionApi.markAlertsRead(alerts.map(a => a.id))
      setAlerts([])
    } catch (err) {
      console.error('Failed to dismiss alerts:', err)
    }
  }

  if (alerts.length === 0 || !visible) return null

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-warning">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">Budget Alerts ({alerts.length})</span>
        </div>
        <button 
          onClick={dismissAll}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Dismiss all
        </button>
      </div>

      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onDismiss={dismissAlert} />
      ))}
    </div>
  )
}

function AlertItem({ alert, onDismiss }) {
  const getAlertStyle = () => {
    if (alert.threshold >= 100) {
      return { bg: 'bg-danger/20', border: 'border-danger', icon: '❌' }
    }
    if (alert.threshold >= 90) {
      return { bg: 'bg-warning/20', border: 'border-warning', icon: '🚨' }
    }
    return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', icon: '⚠️' }
  }

  const style = getAlertStyle()

  return (
    <div className={`${style.bg} border ${style.border} rounded-lg p-3 flex items-start justify-between`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{style.icon}</span>
        <div>
          <p className="text-sm text-text-primary">{alert.message}</p>
          <p className="text-xs text-text-muted mt-1">
            {new Date(alert.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <button 
        onClick={() => onDismiss(alert.id)}
        className="text-text-muted hover:text-text-primary transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default BudgetAlerts
