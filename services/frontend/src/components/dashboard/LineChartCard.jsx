import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '../common'

// mock data - will come from api
const data = [
  { month: 'Jan', income: 4200, expenses: 2800 },
  { month: 'Feb', income: 3800, expenses: 2400 },
  { month: 'Mar', income: 4500, expenses: 3200 },
  { month: 'Apr', income: 4100, expenses: 2900 },
  { month: 'May', income: 4800, expenses: 3100 },
  { month: 'Jun', income: 5200, expenses: 3400 },
  { month: 'Jul', income: 4900, expenses: 3000 },
  { month: 'Aug', income: 5100, expenses: 3300 },
]

function LineChartCard() {
  return (
    <Card className="h-full">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Income vs Expenses</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3D4A3D" />
            <XAxis 
              dataKey="month" 
              stroke="#6B8E6B" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6B8E6B" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2D3A2D', 
                border: 'none',
                borderRadius: '8px',
                color: '#E8F5E9'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="income" 
              name="Income"
              stroke="#C4E538" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#C4E538' }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              name="Expenses"
              stroke="#EF4444" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#EF4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default LineChartCard
