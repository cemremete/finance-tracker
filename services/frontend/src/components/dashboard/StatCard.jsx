import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '../common'

function StatCard({ title, value, change, changeType = 'positive', icon: Icon }) {
  const isPositive = changeType === 'positive'

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-muted text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-primary' : 'text-danger'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </Card>
  )
}

export default StatCard
