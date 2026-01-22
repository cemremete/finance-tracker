import { TrendingUp } from 'lucide-react'

function BalanceCard() {
  // mock data
  const balance = 7540.00
  const change = 8.00 // percentage
  const isPositive = change >= 0

  return (
    <div className="bg-dashboard-card rounded-2xl p-6 text-center">
      <p className="text-gray-400 text-sm mb-2">Total Balance</p>
      
      <h2 className="text-4xl font-bold text-white mb-2">
        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </h2>
      
      <div className={`inline-flex items-center gap-1 ${isPositive ? 'text-mint-green' : 'text-expense-red'}`}>
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

export default BalanceCard
