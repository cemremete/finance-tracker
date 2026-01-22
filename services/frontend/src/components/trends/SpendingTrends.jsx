import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '../common'
import { transactionApi } from '../../services/transactionApi'

function SpendingTrends() {
  const [trends, setTrends] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrends()
  }, [])

  const loadTrends = async () => {
    try {
      const response = await transactionApi.getSpendingTrends()
      setTrends(response.data)
    } catch (err) {
      console.error('Failed to load trends:', err)
      // Use mock data if service unavailable
      setTrends({
        period: {
          current: { label: 'January 2026' },
          previous: { label: 'December 2025' }
        },
        summary: {
          currentExpenses: 8450,
          previousExpenses: 7200,
          expenseChange: 17.4,
          currentIncome: 12000,
          previousIncome: 11500,
          incomeChange: 4.3
        },
        categoryBreakdown: [
          { category: 'food', current: 2500, previous: 2100, change: 19, trend: 'up' },
          { category: 'transport', current: 800, previous: 950, change: -16, trend: 'down' },
          { category: 'entertainment', current: 450, previous: 380, change: 18, trend: 'up' },
          { category: 'bills', current: 1200, previous: 1200, change: 0, trend: 'stable' },
          { category: 'shopping', current: 1800, previous: 1400, change: 29, trend: 'up' }
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

  if (!trends) {
    return (
      <Card>
        <p className="text-text-muted text-center py-8">No trend data available</p>
      </Card>
    )
  }

  const { summary, categoryBreakdown, period } = trends

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Spending Trends</h3>
        <span className="text-sm text-text-muted">{period.current.label} vs {period.previous.label}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <TrendCard
          label="Total Expenses"
          current={summary.currentExpenses}
          previous={summary.previousExpenses}
          change={summary.expenseChange}
          invertColors
        />
        <TrendCard
          label="Total Income"
          current={summary.currentIncome}
          previous={summary.previousIncome}
          change={summary.incomeChange}
        />
      </div>

      {/* Category Comparison Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryBreakdown.slice(0, 6)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#3D4A3D" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="#6B8E6B" 
              fontSize={12}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis 
              type="category" 
              dataKey="category" 
              stroke="#6B8E6B" 
              fontSize={12}
              width={80}
              tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2D3A2D', 
                border: 'none',
                borderRadius: '8px',
                color: '#E8F5E9'
              }}
              formatter={(value) => [`${value.toLocaleString()}₺`, '']}
            />
            <Legend />
            <Bar dataKey="current" name="This Month" fill="#C4E538" radius={[0, 4, 4, 0]} />
            <Bar dataKey="previous" name="Last Month" fill="#6B8E6B" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      <div className="mt-6 space-y-2">
        {categoryBreakdown.slice(0, 5).map((cat) => (
          <CategoryRow key={cat.category} data={cat} />
        ))}
      </div>
    </Card>
  )
}

function TrendCard({ label, current, previous, change, invertColors = false }) {
  const isPositive = change > 0
  const isNegative = change < 0
  
  // For expenses, positive change is bad (red), negative is good (green)
  // For income, positive change is good (green), negative is bad (red)
  const colorClass = invertColors
    ? (isPositive ? 'text-danger' : isNegative ? 'text-primary' : 'text-text-muted')
    : (isPositive ? 'text-primary' : isNegative ? 'text-danger' : 'text-text-muted')

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  return (
    <div className="bg-card-hover rounded-lg p-4">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-xl font-bold text-text-primary">{current.toLocaleString()}₺</p>
      <div className={`flex items-center gap-1 mt-1 text-sm ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span>{Math.abs(change)}%</span>
        <span className="text-text-muted">vs last month</span>
      </div>
    </div>
  )
}

function CategoryRow({ data }) {
  const { category, current, previous, change, trend } = data
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-danger' : trend === 'down' ? 'text-primary' : 'text-text-muted'

  return (
    <div className="flex items-center justify-between py-2 border-b border-card-hover last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-primary capitalize">{category}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">{current.toLocaleString()}₺</span>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
    </div>
  )
}

export default SpendingTrends
