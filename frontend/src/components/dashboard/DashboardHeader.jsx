import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

function DashboardHeader({ userName }) {
  // figure out greeting based on time
  const hour = new Date().getHours()
  let greeting = 'Good morning'
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
  if (hour >= 17) greeting = 'Good evening'

  return (
    <header className="text-center py-8">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to home</span>
      </Link>
      
      <h1 className="text-4xl font-bold text-white">
        {greeting}, <span className="text-lime-green">{userName}</span>!
      </h1>
      <p className="text-gray-400 mt-2">Welcome Back</p>
    </header>
  )
}

export default DashboardHeader
