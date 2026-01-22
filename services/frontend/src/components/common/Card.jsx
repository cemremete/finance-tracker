function Card({ children, className = '', hover = false }) {
  return (
    <div 
      className={`
        bg-card-bg rounded-xl p-6
        ${hover ? 'hover:bg-card-hover transition-colors duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default Card
