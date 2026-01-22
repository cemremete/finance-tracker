// floating notification bubble component
// used on the hero section to show success messages

function NotificationBubble({ icon, text, className = '', delay = '0s', variant = 'default' }) {
  const bgColor = variant === 'success' 
    ? 'bg-lime-green' 
    : 'bg-medium-olive'
  
  const textColor = variant === 'success'
    ? 'text-dark-olive'
    : 'text-white'

  return (
    <div 
      className={`flex items-center gap-2 px-4 py-2 rounded-pill shadow-lg ${bgColor} ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className={`w-6 h-6 rounded-full bg-white/20 flex items-center justify-center ${textColor}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${textColor}`}>
        {text}
      </span>
    </div>
  )
}

export default NotificationBubble
