import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import HealthScore from '../components/analytics/HealthScore'
import SpendingTrends from '../components/trends/SpendingTrends'
import BudgetProgress from '../components/budget/BudgetProgress'
import BudgetAlerts from '../components/budget/BudgetAlerts'

function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Header />

        {/* Budget Alerts */}
        <BudgetAlerts />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Trends */}
          <div className="lg:col-span-2">
            <SpendingTrends />
          </div>

          {/* Right Column - Health Score */}
          <div>
            <HealthScore />
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mt-6">
          <BudgetProgress />
        </div>
      </main>
    </div>
  )
}

export default AnalyticsPage
