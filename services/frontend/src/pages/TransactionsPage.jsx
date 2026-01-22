import { useState, useEffect } from 'react'
import { Plus, Search, Filter, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import { Card, Button } from '../components/common'
import TransactionForm from '../components/transactions/TransactionForm'
import { transactionApi } from '../services/transactionApi'

function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: ''
  })

  useEffect(() => {
    loadTransactions()
  }, [pagination.page, filters])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const response = await transactionApi.getTransactions({
        page: pagination.page,
        limit: 20,
        ...filters
      })
      setTransactions(response.data.transactions)
      setPagination(response.data.pagination)
    } catch (err) {
      console.error('Failed to load transactions:', err)
      // Use mock data if service unavailable
      setTransactions([
        { id: '1', merchant_name: 'Spotify', amount: 15.99, type: 'expense', category: 'entertainment', transaction_date: new Date().toISOString(), auto_categorized: true },
        { id: '2', merchant_name: 'Salary', amount: 5000, type: 'income', category: 'income', transaction_date: new Date().toISOString(), auto_categorized: false },
        { id: '3', merchant_name: 'Migros', amount: 245.50, type: 'expense', category: 'food', transaction_date: new Date().toISOString(), auto_categorized: true },
        { id: '4', merchant_name: 'Netflix', amount: 99.99, type: 'expense', category: 'entertainment', transaction_date: new Date().toISOString(), auto_categorized: true },
        { id: '5', merchant_name: 'Shell', amount: 350, type: 'expense', category: 'transport', transaction_date: new Date().toISOString(), auto_categorized: true },
      ])
      setPagination({ page: 1, totalPages: 1, total: 5, limit: 20 })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (data) => {
    try {
      await transactionApi.createTransaction(data)
      setShowForm(false)
      loadTransactions()
    } catch (err) {
      console.error('Failed to create transaction:', err)
    }
  }

  const handleUpdateTransaction = async (data) => {
    try {
      await transactionApi.updateTransaction(editingTransaction.id, data)
      setEditingTransaction(null)
      loadTransactions()
    } catch (err) {
      console.error('Failed to update transaction:', err)
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await transactionApi.deleteTransaction(id)
      loadTransactions()
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'income': return <TrendingUp className="w-4 h-4 text-primary" />
      case 'expense': return <TrendingDown className="w-4 h-4 text-danger" />
      default: return <ArrowLeftRight className="w-4 h-4 text-accent" />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Header />

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-card-bg border border-text-muted/30 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-4 py-2 bg-card-bg border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>

            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transaction Form Modal */}
        {(showForm || editingTransaction) && (
          <TransactionForm
            initialData={editingTransaction}
            onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
            onCancel={() => {
              setShowForm(false)
              setEditingTransaction(null)
            }}
          />
        )}

        {/* Transactions List */}
        <Card>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-card-hover rounded-lg"></div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-card-hover rounded-lg hover:bg-card-hover/80 transition-colors cursor-pointer"
                  onClick={() => setEditingTransaction(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                      {getTypeIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-text-primary font-medium">
                        {tx.merchant_name || tx.description || 'Transaction'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {tx.category} • {new Date(tx.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === 'income' ? 'text-primary' : 
                      tx.type === 'expense' ? 'text-danger' : 'text-text-primary'
                    }`}>
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                      {parseFloat(tx.amount).toLocaleString()}₺
                    </p>
                    {tx.auto_categorized && (
                      <span className="text-xs text-primary">Auto-categorized</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-text-muted text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

export default TransactionsPage
