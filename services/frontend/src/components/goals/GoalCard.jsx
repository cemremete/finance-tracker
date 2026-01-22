import { useState } from 'react'
import { Target, Plus, TrendingUp, Calendar, ChevronRight } from 'lucide-react'
import { Card, Button } from '../common'
import { transactionApi } from '../../services/transactionApi'

function GoalCard({ goal, onUpdate }) {
  const [showContribute, setShowContribute] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    id,
    name,
    current_amount,
    target_amount,
    percentage,
    remaining,
    deadline,
    monthsRemaining,
    onTrack,
    behindBy,
    status_display,
    auto_round_enabled
  } = goal

  const handleContribute = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    
    setLoading(true)
    try {
      await transactionApi.addContribution(id, { 
        amount: parseFloat(amount),
        source: 'manual'
      })
      setAmount('')
      setShowContribute(false)
      onUpdate?.()
    } catch (err) {
      console.error('Failed to add contribution:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Status Badge */}
      <div 
        className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${status_display.color}20`, color: status_display.color }}
      >
        {status_display.icon} {status_display.label}
      </div>

      {/* Goal Info */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-text-primary pr-24">{name}</h4>
        {deadline && (
          <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(deadline).toLocaleDateString()} 
              {monthsRemaining !== null && ` (${monthsRemaining} months left)`}
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-primary font-medium">
            {current_amount.toLocaleString()}₺
          </span>
          <span className="text-text-muted">
            of {target_amount.toLocaleString()}₺
          </span>
        </div>
        
        <div className="h-3 bg-card-hover rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: status_display.color
            }}
          />
        </div>

        <div className="flex justify-between mt-2 text-xs">
          <span style={{ color: status_display.color }}>{percentage}%</span>
          <span className="text-text-muted">{remaining.toLocaleString()}₺ to go</span>
        </div>
      </div>

      {/* Track Status */}
      {!onTrack && behindBy > 0 && (
        <div className="bg-warning/10 rounded-lg p-2 mb-4 text-xs text-warning">
          ⚠️ You're {behindBy.toLocaleString()}₺ behind schedule
        </div>
      )}

      {/* Auto-round badge */}
      {auto_round_enabled && (
        <div className="bg-primary/10 rounded-lg p-2 mb-4 text-xs text-primary">
          🔄 Auto-rounding enabled
        </div>
      )}

      {/* Actions */}
      {showContribute ? (
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="flex-1 px-3 py-2 bg-card-hover rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button size="sm" onClick={handleContribute} loading={loading}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowContribute(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button 
          className="w-full gap-2" 
          variant="secondary"
          onClick={() => setShowContribute(true)}
        >
          <Plus className="w-4 h-4" />
          Add Contribution
        </Button>
      )}
    </Card>
  )
}

export default GoalCard
