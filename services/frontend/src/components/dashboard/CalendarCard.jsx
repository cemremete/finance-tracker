import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../common'

function CalendarCard() {
  const today = new Date()
  const currentDay = today.getDate()
  const monthName = today.toLocaleString('default', { month: 'long' })
  const year = today.getFullYear()
  
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  // get first day of month and total days
  const firstDay = new Date(year, today.getMonth(), 1).getDay()
  const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate()
  
  // generate calendar grid
  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  return (
    <Card>
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{monthName} {year}</h3>
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg hover:bg-card-hover transition-colors text-text-muted hover:text-text-primary">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-card-hover transition-colors text-text-muted hover:text-text-primary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-xs text-text-muted py-1">
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
              text-center text-sm py-2 rounded-lg transition-colors
              ${day === null ? '' : 'hover:bg-card-hover cursor-pointer'}
              ${day === currentDay ? 'bg-primary text-background font-semibold' : 'text-text-secondary'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default CalendarCard
