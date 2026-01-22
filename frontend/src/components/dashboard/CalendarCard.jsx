import { ChevronRight } from 'lucide-react'

function CalendarCard() {
  // hardcoded for now - april 2025
  const currentMonth = 'April'
  const today = 8 // highlighted day
  
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  // generate calendar grid (simplified)
  // starts on tuesday for april 2025
  const calendarDays = [
    null, 1, 2, 3, 4, 5, 6,
    7, 8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, null, null, null, null
  ]

  return (
    <div className="bg-dashboard-card rounded-2xl p-6">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">{currentMonth}</h3>
        <button className="w-8 h-8 bg-lime-green rounded-lg flex items-center justify-center hover:bg-mint-green transition-colors">
          <ChevronRight className="w-4 h-4 text-dark-olive" />
        </button>
      </div>
      
      {/* day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day, i) => (
          <div key={i} className="text-center text-xs text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => (
          <div 
            key={i}
            className={`
              text-center text-sm py-2 rounded-lg cursor-pointer transition-colors
              ${day === null ? '' : 'hover:bg-medium-olive'}
              ${day === today ? 'bg-lime-green text-dark-olive font-semibold' : 'text-gray-300'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarCard
