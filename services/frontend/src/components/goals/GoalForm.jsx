import { useState } from 'react'
import { X } from 'lucide-react'
import { Button, Input, Card } from '../common'

function GoalForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    target_amount: initialData?.target_amount || '',
    current_amount: initialData?.current_amount || '0',
    deadline: initialData?.deadline || '',
    priority: initialData?.priority || 'medium',
    auto_round_enabled: initialData?.auto_round_enabled || false
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSubmit({
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount) || 0,
        deadline: formData.deadline || null
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-text-primary mb-6">
          {initialData ? 'Edit Goal' : 'Create New Goal'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., New iPhone, Emergency Fund"
            required
          />

          <Input
            label="Target Amount (₺)"
            name="target_amount"
            type="number"
            value={formData.target_amount}
            onChange={handleChange}
            placeholder="45000"
            min="1"
            required
          />

          <Input
            label="Starting Amount (₺)"
            name="current_amount"
            type="number"
            value={formData.current_amount}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />

          <Input
            label="Target Date (Optional)"
            name="deadline"
            type="date"
            value={formData.deadline}
            onChange={handleChange}
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg bg-card-hover border border-text-muted text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="auto_round_enabled"
              checked={formData.auto_round_enabled}
              onChange={handleChange}
              className="w-4 h-4 rounded border-text-muted bg-card-hover text-primary focus:ring-primary"
            />
            <div>
              <span className="text-sm text-text-primary">Enable Auto-Rounding</span>
              <p className="text-xs text-text-muted">
                Round up transactions to nearest 10₺ and save the difference
              </p>
            </div>
          </label>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {initialData ? 'Save Changes' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default GoalForm
