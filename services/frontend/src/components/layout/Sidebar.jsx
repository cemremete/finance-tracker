import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Wallet, 
  Target,
  CreditCard,
  Settings,
  LogOut,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/analytics', icon: PieChart, label: 'Analytics' },
  { path: '/budget', icon: Wallet, label: 'Budget' },
  { path: '/goals', icon: Target, label: 'Goals' },
  { path: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

function Sidebar() {
  const { logout } = useAuth()

  return (
    <aside className="w-64 bg-card-bg min-h-screen p-6 flex flex-col">
      {/* logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-background" />
        </div>
        <span className="text-xl font-bold text-text-primary">Finance</span>
      </div>

      {/* navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-background font-medium' 
                    : 'text-text-secondary hover:bg-card-hover hover:text-text-primary'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* logout */}
      <button
        onClick={logout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-danger/20 hover:text-danger transition-colors w-full"
      >
        <LogOut className="w-5 h-5" />
        <span>Logout</span>
      </button>
    </aside>
  )
}

export default Sidebar
