import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Incomes', value: 65 },
  { name: 'Expenses', value: 35 },
]

const COLORS = ['#A8E6A3', '#EF4444']

function DonutChartCard() {
  return (
    <div className="bg-dashboard-card rounded-2xl p-6">
      {/* legend */}
      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-mint-green" />
          <span className="text-sm text-gray-400">Incomes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-expense-red" />
          <span className="text-sm text-gray-400">Expenses</span>
        </div>
      </div>
      
      {/* donut chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DonutChartCard
