import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button, Input, Card } from '../common'
import { transactionApi } from '../../services/transactionApi'

function TransactionForm({ onSubmit, onCancel, initialData = null }) {
  const [categories, setCategories] = useState([])
  const [suggestedCategory, setSuggestedCategory] = useState(null)
  const [formData, setFormData] = useState({
    amount: initialData?.amount || '',
    type: initialData?.type || 'expense',
    category: initialData?.category || '',
    merchant_name: initialData?.merchant_name || '',
    description: initialData?.description || '',
    transaction_date: initialData?.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await transactionApi.getCategories()
      setCategories(response.data)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Auto-categorize when merchant name changes
    if (name === 'merchant_name' && value.length >= 3) {
      autoCategorizeMerchant(value)
    }
  }

  const autoCategorizeMerchant = async (merchantName) => {
    try {
      const response = await transactionApi.categorize(merchantName)
      if (response.data.category !== 'uncategorized') {
        setSuggestedCategory(response.data)
        if (!formData.category) {
          setFormData(prev => ({ ...prev, category: response.data.category }))
        }
      }
    } catch (err) {
      // Ignore categorization errors
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
        transaction_date: new Date(formData.transaction_date).toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-text-primary mb-6">
          {initialData ? 'Edit Transaction' : 'Add Transaction'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              {['expense', 'income', 'transfer'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.type === type
                      ? type === 'income' 
                        ? 'bg-primary text-background' 
                        : type === 'expense'
                        ? 'bg-danger text-white'
                        : 'bg-accent text-background'
                      : 'bg-card-hover text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Amount (₺)"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0.01"
            step="0.01"
            required
          />

          <Input
            label="Merchant / Source"
            name="merchant_name"
            value={formData.merchant_name}
            onChange={handleChange}
            placeholder="e.g., Migros, Spotify, Salary"
          />

          {/* Auto-category suggestion */}
          {suggestedCategory && suggestedCategory.category !== formData.category && (
            <div className="bg-primary/10 rounded-lg p-2 text-xs text-primary flex items-center justify-between">
              <span>Suggested: {suggestedCategory.category}</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: suggestedCategory.category }))}
                className="underline"
              >
                Apply
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg bg-card-hover border border-text-muted text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add notes..."
          />

          <Input
            label="Date"
            name="transaction_date"
            type="date"
            value={formData.transaction_date}
            onChange={handleChange}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              {initialData ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default TransactionForm
