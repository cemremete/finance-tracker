import { useState, useEffect } from 'react'
import { Target, Plus, Trophy } from 'lucide-react'
import { Card, Button } from '../common'
import GoalCard from './GoalCard'
import GoalForm from './GoalForm'
import { transactionApi } from '../../services/transactionApi'

function GoalsList() {
  const [goals, setGoals] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        transactionApi.getGoals('all'),
        transactionApi.getGoalSummary()
      ])
      setGoals(goalsRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.error('Failed to load goals:', err)
      // Use mock data if service unavailable
      setGoals([
        { id: '1', name: 'Emergency Fund', current_amount: 15000, target_amount: 50000, percentage: 30, remaining: 35000, deadline: '2026-12-31', status: 'active', onTrack: true, behindBy: 0, auto_round_enabled: true, status_display: { label: 'Good Start', color: '#9B59B6', icon: '🚀' } },
        { id: '2', name: 'New iPhone', current_amount: 22000, target_amount: 45000, percentage: 49, remaining: 23000, deadline: '2026-06-01', status: 'active', onTrack: false, behindBy: 5000, auto_round_enabled: false, status_display: { label: 'Halfway', color: '#3498DB', icon: '💪' } }
      ])
      setSummary({ activeGoals: 2, completedGoals: 1, totalCurrent: 37000, totalTarget: 95000, overallProgress: 39, autoRoundThisMonth: 127 })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (data) => {
    try {
      await transactionApi.createGoal(data)
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Failed to create goal:', err)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-24 bg-card-bg rounded-xl"></div>
        <div className="h-48 bg-card-bg rounded-xl"></div>
      </div>
    )
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  return (
    <div className="space-y-6">
      {/* Summary */}
      {summary && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Savings Goals</h3>
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
              <Plus className="w-4 h-4" />
              New Goal
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card-hover rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{summary.activeGoals}</p>
              <p className="text-xs text-text-muted">Active Goals</p>
            </div>
            <div className="bg-card-hover rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-text-primary">{summary.completedGoals}</p>
              <p className="text-xs text-text-muted">Completed</p>
            </div>
            <div className="bg-card-hover rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-text-secondary">
                {summary.totalCurrent?.toLocaleString() || 0}₺
              </p>
              <p className="text-xs text-text-muted">Total Saved</p>
            </div>
            <div className="bg-card-hover rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-accent">{summary.overallProgress}%</p>
              <p className="text-xs text-text-muted">Overall Progress</p>
            </div>
          </div>

          {summary.autoRoundThisMonth > 0 && (
            <div className="mt-4 bg-primary/10 rounded-lg p-3 text-sm text-primary">
              🔄 Auto-rounding saved you {summary.autoRoundThisMonth.toLocaleString()}₺ this month!
            </div>
          )}
        </Card>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm 
          onSubmit={handleCreateGoal} 
          onCancel={() => setShowForm(false)} 
        />
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Active Goals ({activeGoals.length})
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={loadData} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Completed ({completedGoals.length})
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onUpdate={loadData} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="text-center py-12">
          <Target className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No savings goals yet</h3>
          <p className="text-text-muted mb-4">Create your first goal to start saving!</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Goal
          </Button>
        </Card>
      )}
    </div>
  )
}

export default GoalsList
