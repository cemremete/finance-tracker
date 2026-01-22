import { Wallet, Hand, BarChart2, Users } from 'lucide-react'

function FeaturesSection() {
  return (
    <section className="px-12 py-16 bg-gray-50">
      {/* section header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          First Class Software
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Get real-time insights, seamless transactions, and advanced 
          tools to manage your wealth effortlessly
        </p>
      </div>
      
      {/* features grid */}
      <div className="grid grid-cols-4 gap-5 max-w-5xl mx-auto">
        <FeatureCard 
          icon={<Wallet className="w-8 h-8" />}
          title="Safe Storage"
        />
        <FeatureCard 
          icon={<Hand className="w-8 h-8" />}
          title="Secure"
        />
        <FeatureCard 
          icon={<BarChart2 className="w-8 h-8" />}
          title="Earn Interest"
        />
        <FeatureCard 
          icon={<Users className="w-8 h-8" />}
          title="Collaborate"
        />
      </div>
      
      {/* app showcase section */}
      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-8">
          The Most Reliable App
        </h3>
        
        <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* card image placeholder */}
          <div className="bg-medium-olive rounded-2xl p-8 aspect-[4/3] flex items-center justify-center">
            <div className="w-48 h-32 bg-dark-olive rounded-xl transform rotate-[-15deg] shadow-xl" />
          </div>
          
          {/* form image placeholder */}
          <div className="bg-gray-200 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <p className="text-4xl font-bold">2020</p>
              <p className="text-sm">Form 1040-ES</p>
            </div>
          </div>
        </div>
        
        {/* descriptions */}
        <div className="grid grid-cols-2 gap-6 max-w-3xl mx-auto mt-4">
          <div className="text-left">
            <h4 className="font-semibold text-gray-800 mb-1">Scale Your Team, Not Your Card Expenses</h4>
            <p className="text-sm text-gray-500">Issue virtual and physical cards at no additional cost to support teams of any size.</p>
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-800 mb-1">Effortless Paper Tracking, Mobile Convenience</h4>
            <p className="text-sm text-gray-500">Get precise control—at scale—with the ability to lock any card and restrict any type of spend.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title }) {
  return (
    <div className="bg-medium-olive rounded-2xl p-6 text-center hover:scale-[1.02] transition-transform cursor-pointer group">
      <div className="w-16 h-16 mx-auto mb-4 border-2 border-lime-green/50 rounded-xl flex items-center justify-center text-lime-green group-hover:border-lime-green transition-colors">
        {icon}
      </div>
      <p className="text-white font-medium">{title}</p>
    </div>
  )
}

export default FeaturesSection
