import { ShoppingBag, Coffee, Home, Car, Utensils, Briefcase, TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from '../common'

// mock transactions
const transactions = [
  { id: 1, name: 'Salary Deposit', category: 'income', amount: 5200, date: '2024-01-15', icon: Briefcase },
  { id: 2, name: 'Grocery Store', category: 'food', amount: -156.32, date: '2024-01-14', icon: ShoppingBag },
  { id: 3, name: 'Coffee Shop', category: 'food', amount: -8.50, date: '2024-01-14', icon: Coffee },
  { id: 4, name: 'Rent Payment', category: 'housing', amount: -1500, date: '2024-01-01', icon: Home },
  { id: 5, name: 'Gas Station', category: 'transport', amount: -45.00, date: '2024-01-13', icon: Car },
  { id: 6, name: 'Restaurant', category: 'food', amount: -62.80, date: '2024-01-12', icon: Utensils },
]

function TransactionList() {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Recent Transactions</h3>
        <button className="text-sm text-primary hover:text-primary-dark transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>
    </Card>
  )
}

function TransactionItem({ transaction }) {
  const Icon = transaction.icon
  const isIncome = transaction.amount > 0
  
  return (
    <div className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer">
      {/* icon */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center
        ${isIncome ? 'bg-primary/20 text-primary' : 'bg-card-hover text-text-secondary'}
      `}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* name and date */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium truncate">{transaction.name}</p>
        <p className="text-text-muted text-xs">
          {new Date(transaction.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </p>
      </div>
      
      {/* amount */}
      <div className={`flex items-center gap-1 font-semibold ${isIncome ? 'text-primary' : 'text-danger'}`}>
        {isIncome ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>
          {isIncome ? '+' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}

export default TransactionList
