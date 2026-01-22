import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import StatCard from '../components/dashboard/StatCard'
import LineChartCard from '../components/dashboard/LineChartCard'
import DonutChartCard from '../components/dashboard/DonutChartCard'
import CalendarCard from '../components/dashboard/CalendarCard'
import TransactionList from '../components/dashboard/TransactionList'

function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* sidebar */}
      <Sidebar />

      {/* main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Header />

        {/* stats row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Balance"
            value="$24,562.00"
            change="+12.5% from last month"
            changeType="positive"
            icon={Wallet}
          />
          <StatCard 
            title="Total Income"
            value="$8,450.00"
            change="+8.2% from last month"
            changeType="positive"
            icon={TrendingUp}
          />
          <StatCard 
            title="Total Expenses"
            value="$3,280.00"
            change="-4.1% from last month"
            changeType="positive"
            icon={TrendingDown}
          />
          <StatCard 
            title="Total Savings"
            value="$5,170.00"
            change="+15.3% from last month"
            changeType="positive"
            icon={PiggyBank}
          />
        </div>

        {/* charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <LineChartCard />
          </div>
          <div>
            <DonutChartCard />
          </div>
        </div>

        {/* bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionList />
          </div>
          <div>
            <CalendarCard />
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
