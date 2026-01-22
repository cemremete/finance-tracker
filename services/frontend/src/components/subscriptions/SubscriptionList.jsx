import { useState, useEffect } from 'react'
import { Calendar, AlertCircle, Pause, Trash2, Plus } from 'lucide-react'
import { Card, Button } from '../common'
import { transactionApi } from '../../services/transactionApi'

function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [subsRes, summaryRes] = await Promise.all([
        transactionApi.getSubscriptions(),
        transactionApi.getSubscriptionSummary()
      ])
      setSubscriptions(subsRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
      // Use mock data if service unavailable
      setSubscriptions([
        { id: '1', name: 'Spotify', amount: 59.99, frequency: 'monthly', category: 'entertainment', next_payment_date: '2026-02-01', days_until_payment: 10, status: 'active', monthly_cost: 59.99 },
        { id: '2', name: 'Netflix', amount: 99.99, frequency: 'monthly', category: 'entertainment', next_payment_date: '2026-01-28', days_until_payment: 6, status: 'active', monthly_cost: 99.99 },
        { id: '3', name: 'Gym Membership', amount: 200, frequency: 'monthly', category: 'health', next_payment_date: '2026-02-05', days_until_payment: 14, status: 'active', monthly_cost: 200 }
      ])
      setSummary({
        totalSubscriptions: 3,
        monthlyTotal: 359.98,
        yearlyTotal: 4319.76,
        upcomingPayments: [
          { name: 'Netflix', amount: 99.99, date: '2026-01-28', days_until: 6 }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-64 bg-card-hover rounded-lg"></div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Subscriptions</h3>
        <Button size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card-hover rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-text-primary">{summary.totalSubscriptions}</p>
            <p className="text-xs text-text-muted">Active</p>
          </div>
          <div className="bg-card-hover rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{summary.monthlyTotal.toLocaleString()}₺</p>
            <p className="text-xs text-text-muted">Monthly</p>
          </div>
          <div className="bg-card-hover rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-text-secondary">{summary.yearlyTotal.toLocaleString()}₺</p>
            <p className="text-xs text-text-muted">Yearly</p>
          </div>
        </div>
      )}

      {/* Upcoming Payments */}
      {summary?.upcomingPayments?.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Upcoming Payments</h4>
          <div className="space-y-2">
            {summary.upcomingPayments.map((payment, i) => (
              <div key={i} className="flex items-center justify-between bg-warning/10 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-warning" />
                  <span className="text-sm text-text-primary">{payment.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">{payment.amount}₺</p>
                  <p className="text-xs text-warning">in {payment.days_until} days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription List */}
      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <p className="text-text-muted text-center py-8">No subscriptions yet</p>
        ) : (
          subscriptions.map((sub) => (
            <SubscriptionItem key={sub.id} subscription={sub} onUpdate={loadData} />
          ))
        )}
      </div>
    </Card>
  )
}

function SubscriptionItem({ subscription, onUpdate }) {
  const { name, amount, frequency, category, next_payment_date, days_until_payment, status } = subscription

  const frequencyLabel = {
    weekly: '/week',
    monthly: '/month',
    yearly: '/year'
  }

  const handlePause = async () => {
    try {
      await transactionApi.updateSubscription(subscription.id, { 
        status: status === 'active' ? 'paused' : 'active' 
      })
      onUpdate()
    } catch (err) {
      console.error('Failed to update subscription:', err)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this subscription?')) return
    try {
      await transactionApi.deleteSubscription(subscription.id)
      onUpdate()
    } catch (err) {
      console.error('Failed to delete subscription:', err)
    }
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      status === 'active' ? 'bg-card-hover border-transparent' : 'bg-background border-text-muted/20 opacity-60'
    }`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <span className="text-lg">💳</span>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{name}</p>
          <p className="text-xs text-text-muted capitalize">{category}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary">
            {amount}₺{frequencyLabel[frequency]}
          </p>
          {days_until_payment !== undefined && days_until_payment >= 0 && (
            <p className="text-xs text-text-muted">
              {days_until_payment === 0 ? 'Today' : `in ${days_until_payment} days`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={handlePause}
            className="p-1.5 rounded hover:bg-card-hover transition-colors text-text-muted hover:text-text-primary"
            title={status === 'active' ? 'Pause' : 'Resume'}
          >
            <Pause className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 rounded hover:bg-danger/20 transition-colors text-text-muted hover:text-danger"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionList
