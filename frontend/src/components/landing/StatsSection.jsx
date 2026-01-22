import { BarChart3, DollarSign, ArrowUpRight } from 'lucide-react'

function StatsSection() {
  return (
    <section className="px-12 py-16 bg-white">
      {/* section header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Get More Done In A Week
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Maximize your productivity with smarter tools designed to streamline 
          your workflow, automate tasks, and organize
        </p>
      </div>
      
      {/* stats grid - 2x2 */}
      <div className="grid grid-cols-2 gap-5 max-w-3xl mx-auto">
        <StatCard 
          value="2x"
          label="Double Your Productivity"
        />
        <StatCard 
          icon={<BarChart3 className="w-8 h-8" />}
          label="Efficiency Increase Per Transfer"
          showChart
        />
        <StatCard 
          icon={<DollarSign className="w-8 h-8" />}
          label="Centralize Your Finances"
          showIcon
        />
        <StatCard 
          value="130%"
          label="More Activity"
        />
      </div>
    </section>
  )
}

function StatCard({ value, label, icon, showChart, showIcon }) {
  return (
    <div className="bg-lime-green rounded-2xl p-8 text-dark-olive hover:scale-[1.02] transition-transform cursor-pointer">
      {/* content varies based on props */}
      <div className="h-24 flex items-center justify-center mb-4">
        {value && (
          <span className="text-5xl font-bold">{value}</span>
        )}
        {showChart && (
          <div className="flex items-end gap-1 h-16">
            {/* simple bar chart visualization */}
            {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90].map((height, i) => (
              <div 
                key={i}
                className="w-3 bg-dark-olive/20 rounded-t"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        )}
        {showIcon && (
          <div className="w-20 h-20 rounded-full border-4 border-dark-olive/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-dark-olive/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>
      
      <p className="text-center font-medium">{label}</p>
    </div>
  )
}

export default StatsSection
