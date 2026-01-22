import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import GoalsList from '../components/goals/GoalsList'

function GoalsPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Header />
        <GoalsList />
      </main>
    </div>
  )
}

export default GoalsPage
