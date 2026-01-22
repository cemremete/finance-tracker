import api from './api'

export const transactionApi = {
  // Transactions
  getTransactions: (params) => api.get('/api/transactions', { params }),
  getTransaction: (id) => api.get(`/api/transactions/${id}`),
  createTransaction: (data) => api.post('/api/transactions', data),
  updateTransaction: (id, data) => api.put(`/api/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/api/transactions/${id}`),
  getSummary: (params) => api.get('/api/transactions/summary', { params }),
  getMonthly: (months = 6) => api.get('/api/transactions/monthly', { params: { months } }),
  getCategories: () => api.get('/api/transactions/categories'),
  categorize: (merchant_name) => api.post('/api/transactions/categorize', { merchant_name }),

  // Budgets
  getBudgets: () => api.get('/api/budgets'),
  getBudgetProgress: () => api.get('/api/budgets/progress'),
  getBudgetAlerts: () => api.get('/api/budgets/alerts'),
  markAlertsRead: (alertIds) => api.post('/api/budgets/alerts/read', { alertIds }),
  createBudget: (data) => api.post('/api/budgets', data),
  deleteBudget: (id) => api.delete(`/api/budgets/${id}`),

  // Subscriptions
  getSubscriptions: (includeInactive = false) => 
    api.get('/api/subscriptions', { params: { includeInactive } }),
  getSubscriptionSummary: () => api.get('/api/subscriptions/summary'),
  getDetectedSubscriptions: () => api.get('/api/subscriptions/detected'),
  getSubscriptionRecommendations: () => api.get('/api/subscriptions/recommendations'),
  getSubscriptionReminders: () => api.get('/api/subscriptions/reminders'),
  createSubscription: (data) => api.post('/api/subscriptions', data),
  updateSubscription: (id, data) => api.put(`/api/subscriptions/${id}`, data),
  deleteSubscription: (id) => api.delete(`/api/subscriptions/${id}`),

  // Goals
  getGoals: (status = 'active') => api.get('/api/goals', { params: { status } }),
  getGoalSummary: () => api.get('/api/goals/summary'),
  getGoal: (id) => api.get(`/api/goals/${id}`),
  getGoalContributions: (id, limit = 20) => 
    api.get(`/api/goals/${id}/contributions`, { params: { limit } }),
  createGoal: (data) => api.post('/api/goals', data),
  addContribution: (id, data) => api.post(`/api/goals/${id}/contribute`, data),
  updateGoal: (id, data) => api.put(`/api/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/api/goals/${id}`),

  // Analytics
  getSpendingTrends: (period = 'monthly') => 
    api.get('/api/analytics/trends', { params: { period } }),
  getSpendingHistory: (months = 6) => 
    api.get('/api/analytics/history', { params: { months } }),
  getHealthScore: () => api.get('/api/analytics/health-score'),
  getHealthScoreHistory: (months = 6) => 
    api.get('/api/analytics/health-score/history', { params: { months } })
}

export default transactionApi
