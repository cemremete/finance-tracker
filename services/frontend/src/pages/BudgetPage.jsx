import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { Card, Button, Input } from '../components/common'
import BudgetProgress from '../components/budget/BudgetProgress'
import { transactionApi } from '../services/transactionApi'

function BudgetPage() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        transactionApi.getBudgets(),
        transactionApi.getCategories()
      ])
      setBudgets(budgetsRes.data)
      setCategories(categoriesRes.data.filter(c => c.id !== 'income' && c.id !== 'uncategorized'))
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await transactionApi.createBudget({
        ...formData,
        amount: parseFloat(formData.amount)
      })
      setShowForm(false)
      setFormData({ category: '', amount: '', period: 'monthly' })
      loadData()
    } catch (err) {
      console.error('Failed to create budget:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return
    try {
      await transactionApi.deleteBudget(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete budget:', err)
    }
  }

  // Get categories that don't have budgets yet
  const availableCategories = categories.filter(
    cat => !budgets.some(b => b.category === cat.id)
  )

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Header />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Budget Management</h2>
          {availableCategories.length > 0 && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Budget
            </Button>
          )}
        </div>

        {/* Add Budget Form */}
        {showForm && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Create Budget</h3>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-card-hover border border-text-muted text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Monthly Limit (₺)"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="2000"
                min="1"
                required
              />

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-card-hover border border-text-muted text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">Create</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Budget Progress */}
        <BudgetProgress />

        {/* Budget List */}
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">All Budgets</h3>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-card-hover rounded-lg"></div>
              ))}
            </div>
          ) : budgets.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              No budgets set. Create one to start tracking!
            </p>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const category = categories.find(c => c.id === budget.category)
                return (
                  <div 
                    key={budget.id}
                    className="flex items-center justify-between p-4 bg-card-hover rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category?.icon || '📊'}</span>
                      <div>
                        <p className="text-text-primary font-medium capitalize">{budget.category}</p>
                        <p className="text-xs text-text-muted">{budget.period}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-text-primary font-semibold">
                          {parseFloat(budget.amount).toLocaleString()}₺
                        </p>
                        <p className="text-xs text-text-muted">
                          {parseFloat(budget.spent_amount || 0).toLocaleString()}₺ spent
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-2 rounded hover:bg-danger/20 transition-colors text-text-muted hover:text-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

export default BudgetPage
