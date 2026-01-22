import DashboardHeader from '../components/dashboard/DashboardHeader'
import LineChartCard from '../components/dashboard/LineChartCard'
import CalendarCard from '../components/dashboard/CalendarCard'
import TransactionsList from '../components/dashboard/TransactionsList'
import DonutChartCard from '../components/dashboard/DonutChartCard'
import BalanceCard from '../components/dashboard/BalanceCard'

function Dashboard() {
  // TODO: get this from auth context later
  const userName = "Jane Doe"

  return (
    <div className="min-h-screen bg-dashboard-bg">
      {/* curved background overlays */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-medium-olive/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-medium-olive/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 p-8 max-w-6xl mx-auto">
        <DashboardHeader userName={userName} />
        
        {/* main grid layout */}
        <div className="grid grid-cols-12 gap-6 mt-8">
          {/* line chart - takes up more space */}
          <div className="col-span-8">
            <LineChartCard />
          </div>
          
          {/* calendar */}
          <div className="col-span-4">
            <CalendarCard />
          </div>
          
          {/* transactions list */}
          <div className="col-span-6">
            <TransactionsList />
          </div>
          
          {/* right column - donut + balance */}
          <div className="col-span-6 space-y-6">
            <DonutChartCard />
            <BalanceCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
