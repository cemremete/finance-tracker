import { ChevronRight, Music, ShoppingBag, Coffee, Wifi } from 'lucide-react'

// mock transactions - will come from api
const transactions = [
  { id: 1, name: 'Spotify', date: 'April 16, 2025 04:34 AM', amount: 400.00, icon: Music },
  { id: 2, name: 'Spotify', date: 'April 16, 2025 04:34 AM', amount: 400.00, icon: Music },
  { id: 3, name: 'Spotify', date: 'April 16, 2025 04:34 AM', amount: 400.00, icon: Music },
  { id: 4, name: 'Spotify', date: 'April 16, 2025 04:34 AM', amount: 400.00, icon: Music },
  { id: 5, name: 'Spotify', date: 'April 16, 2025 04:34 AM', amount: 400.00, icon: Music },
  { id: 6, name: 'Spotify', date: 'April 16, 2025 04:34 AM', amount: 400.00, icon: Music },
]

function TransactionsList() {
  return (
    <div className="bg-dashboard-card rounded-2xl p-6">
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold">Transactions</h3>
        <button className="w-8 h-8 bg-lime-green rounded-lg flex items-center justify-center hover:bg-mint-green transition-colors">
          <ChevronRight className="w-4 h-4 text-dark-olive" />
        </button>
      </div>
      
      {/* transactions list */}
      <div className="space-y-4">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  )
}

function TransactionItem({ transaction }) {
  const Icon = transaction.icon
  
  return (
    <div className="flex items-center gap-4 hover:bg-medium-olive/30 p-2 -mx-2 rounded-lg transition-colors cursor-pointer">
      {/* icon */}
      <div className="w-10 h-10 bg-medium-olive rounded-full flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      
      {/* name and date */}
      <div className="flex-1">
        <p className="text-white font-medium">{transaction.name}</p>
        <p className="text-gray-500 text-xs">{transaction.date}</p>
      </div>
      
      {/* amount */}
      <p className="text-mint-green font-semibold">
        ${transaction.amount.toFixed(2)}
      </p>
    </div>
  )
}

export default TransactionsList
