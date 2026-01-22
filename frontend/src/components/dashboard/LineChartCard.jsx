import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// mock data - will come from api later
const data = [
  { month: 'J', income: 4000, expenses: 2400 },
  { month: 'F', income: 3000, expenses: 1398 },
  { month: 'M', income: 2000, expenses: 3800 },
  { month: 'A', income: 2780, expenses: 3908 },
  { month: 'M', income: 1890, expenses: 4800 },
  { month: 'J', income: 2390, expenses: 3800 },
  { month: 'J', income: 3490, expenses: 4300 },
  { month: 'A', income: 4000, expenses: 2400 },
  { month: 'S', income: 3200, expenses: 2800 },
]

function LineChartCard() {
  return (
    <div className="bg-dashboard-card rounded-2xl p-6">
      {/* legend */}
      <div className="flex gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-mint-green" />
          <span className="text-sm text-gray-400">Incomes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-expense-red" />
          <span className="text-sm text-gray-400">Expenses</span>
        </div>
      </div>
      
      {/* chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D4A1F" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2D3A1A', 
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#A8E6A3" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#A8E6A3' }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#EF4444" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default LineChartCard
