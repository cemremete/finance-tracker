import { Zap, Globe, Cpu, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function Sidebar() {
  return (
    <aside className="w-[380px] min-h-screen bg-dark-olive text-white p-10 flex flex-col sticky top-0">
      {/* header with logo and cta */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lime-green rounded-lg flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-dark-olive" />
          </div>
          <span className="text-xl font-bold">Etran</span>
        </div>
        
        <Link 
          to="/dashboard"
          className="bg-lime-green text-dark-olive px-4 py-2 rounded-lg font-semibold text-sm hover:bg-mint-green transition-colors"
        >
          Get started
        </Link>
      </div>
      
      {/* main hero text */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold leading-tight mb-4">
          Money Transfers<br />
          Made <span className="text-lime-green">Simple</span>
        </h1>
        <p className="text-gray-300 text-sm">
          No personal credit checks or founder guarantee.
        </p>
      </div>
      
      {/* offerings section */}
      <div className="mb-auto">
        <p className="text-sm text-gray-400 mb-4">Our offerings</p>
        
        <div className="grid grid-cols-3 gap-3">
          <OfferingCard 
            icon={<Zap className="w-5 h-5" />}
            title="Instant"
            subtitle="Productivity"
          />
          <OfferingCard 
            icon={<Globe className="w-5 h-5" />}
            title="Expense"
            subtitle="Management"
          />
          <OfferingCard 
            icon={<Cpu className="w-5 h-5" />}
            title="Advanced"
            subtitle="Technology"
          />
        </div>
      </div>
      
      {/* footer links */}
      <footer className="flex gap-6 text-sm text-gray-400">
        <a href="#" className="hover:text-white transition-colors">Contact</a>
        <a href="#" className="hover:text-white transition-colors">Social</a>
        <a href="#" className="hover:text-white transition-colors">Address</a>
        <a href="#" className="hover:text-white transition-colors">Legal Terms</a>
      </footer>
    </aside>
  )
}

// small card for the offerings grid
function OfferingCard({ icon, title, subtitle }) {
  return (
    <div className="bg-medium-olive rounded-xl p-4 text-center hover:bg-opacity-80 transition-all cursor-pointer group">
      <div className="w-10 h-10 mx-auto mb-3 border border-lime-green/30 rounded-lg flex items-center justify-center text-lime-green group-hover:border-lime-green transition-colors">
        {icon}
      </div>
      <p className="text-xs font-medium">{title}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  )
}

export default Sidebar
