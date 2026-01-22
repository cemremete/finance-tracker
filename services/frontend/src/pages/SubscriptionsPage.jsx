import { useState, useEffect } from 'react'
import { Lightbulb, AlertTriangle } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { Card } from '../components/common'
import SubscriptionList from '../components/subscriptions/SubscriptionList'
import { transactionApi } from '../services/transactionApi'

function SubscriptionsPage() {
  const [detected, setDetected] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [detectedRes, recsRes] = await Promise.all([
        transactionApi.getDetectedSubscriptions(),
        transactionApi.getSubscriptionRecommendations()
      ])
      setDetected(detectedRes.data)
      setRecommendations(recsRes.data)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDetected = async (sub) => {
    try {
      await transactionApi.createSubscription({
        name: sub.name,
        amount: sub.amount,
        frequency: sub.frequency,
        next_payment_date: sub.suggestedNextDate
      })
      loadData()
    } catch (err) {
      console.error('Failed to add subscription:', err)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Header />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Subscription List */}
          <div className="lg:col-span-2">
            <SubscriptionList />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Detected Subscriptions */}
            {detected.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-text-primary">Detected</h3>
                </div>
                <p className="text-sm text-text-muted mb-4">
                  We found recurring expenses that might be subscriptions
                </p>
                <div className="space-y-3">
                  {detected.map((sub, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-text-primary capitalize">{sub.name}</p>
                        <p className="text-xs text-text-muted">
                          {sub.amount}₺/{sub.frequency} • {sub.occurrences} times
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddDetected(sub)}
                        className="text-xs text-primary hover:underline"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <h3 className="text-lg font-semibold text-text-primary">Recommendations</h3>
                </div>
                <div className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-warning/10 rounded-lg">
                      <p className="text-sm text-text-primary">{rec.suggestion}</p>
                      {rec.totalMonthlyCost && (
                        <p className="text-xs text-warning mt-1">
                          Total: {rec.totalMonthlyCost}₺/month
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SubscriptionsPage
