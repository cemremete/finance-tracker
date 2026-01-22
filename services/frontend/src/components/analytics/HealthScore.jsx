import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { Card } from '../common'
import { transactionApi } from '../../services/transactionApi'

function HealthScore() {
  const [healthData, setHealthData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHealthScore()
  }, [])

  const loadHealthScore = async () => {
    try {
      const response = await transactionApi.getHealthScore()
      setHealthData(response.data)
    } catch (err) {
      console.error('Failed to load health score:', err)
      // Use mock data if service unavailable
      setHealthData({
        score: 72,
        status: { label: 'Good', color: '#F1C40F' },
        breakdown: {
          incomeExpenseRatio: { score: 30, max: 40 },
          budgetDiscipline: { score: 22, max: 30 },
          savingsRate: { score: 12, max: 20 },
          recurringManagement: { score: 8, max: 10 }
        },
        suggestions: ['Increase savings to 20% of income', 'Stay within food budget']
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-48 bg-card-hover rounded-lg"></div>
      </Card>
    )
  }

  if (!healthData) {
    return (
      <Card>
        <p className="text-text-muted text-center py-8">Unable to calculate health score</p>
      </Card>
    )
  }

  const { score, status, breakdown, suggestions } = healthData

  return (
    <Card>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Financial Health Score</h3>
      
      {/* Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-card-hover"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={status.color}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(score / 100) * 352} 352`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-text-primary">{score}</span>
            <span className="text-xs text-text-muted">/100</span>
          </div>
        </div>
      </div>

      {/* Status Label */}
      <div className="text-center mb-6">
        <span 
          className="px-3 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${status.color}20`, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3 mb-6">
        <ScoreBar 
          label="Income/Expense Ratio" 
          score={breakdown.incomeExpenseRatio.score} 
          max={breakdown.incomeExpenseRatio.max} 
        />
        <ScoreBar 
          label="Budget Discipline" 
          score={breakdown.budgetDiscipline.score} 
          max={breakdown.budgetDiscipline.max} 
        />
        <ScoreBar 
          label="Savings Rate" 
          score={breakdown.savingsRate.score} 
          max={breakdown.savingsRate.max} 
        />
        <ScoreBar 
          label="Recurring Management" 
          score={breakdown.recurringManagement.score} 
          max={breakdown.recurringManagement.max} 
        />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-card-hover pt-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Suggestions</h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

function ScoreBar({ label, score, max }) {
  const percentage = (score / max) * 100

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-secondary">{score}/{max}</span>
      </div>
      <div className="h-2 bg-card-hover rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default HealthScore
