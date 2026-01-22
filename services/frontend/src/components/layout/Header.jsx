import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

function Header() {
  const { user } = useAuth()
  
  // get greeting based on time
  const hour = new Date().getHours()
  let greeting = 'Good morning'
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
  if (hour >= 17) greeting = 'Good evening'

  const userName = user?.firstName || 'User'

  return (
    <header className="flex items-center justify-between py-6">
      {/* greeting */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}, <span className="text-primary">{userName}</span>!
        </h1>
        <p className="text-text-muted">Here's what's happening with your finances</p>
      </div>

      {/* actions */}
      <div className="flex items-center gap-4">
        {/* search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-card-bg border border-text-muted/30 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-64"
          />
        </div>

        {/* notifications */}
        <button className="relative p-2 rounded-lg bg-card-bg hover:bg-card-hover transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        {/* avatar */}
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-background font-semibold">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}

export default Header
