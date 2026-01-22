import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card } from '../common'

const data = [
  { name: 'Income', value: 5200, color: '#C4E538' },
  { name: 'Expenses', value: 3400, color: '#EF4444' },
]

function DonutChartCard() {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const savings = data[0].value - data[1].value
  const savingsPercent = ((savings / data[0].value) * 100).toFixed(0)

  return (
    <Card>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Monthly Overview</h3>
      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
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
          </PieChart>
        </ResponsiveContainer>
        {/* center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">+{savingsPercent}%</p>
            <p className="text-xs text-text-muted">Saved</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default DonutChartCard
