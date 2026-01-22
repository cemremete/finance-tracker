import { Check, Coins, CreditCard } from 'lucide-react'
import NotificationBubble from './NotificationBubble'

function HeroSection() {
  return (
    <section className="p-12">
      {/* hero image with floating notifications */}
      <div className="relative max-w-2xl mx-auto mb-12">
        {/* main image container */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* placeholder for hero image - using gradient for now */}
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white/50">
              <CreditCard className="w-16 h-16 mx-auto mb-2" />
              <p className="text-sm">Hero Image</p>
            </div>
          </div>
        </div>
        
        {/* floating notification bubbles */}
        <NotificationBubble 
          icon={<Coins className="w-4 h-4" />}
          text="Interest earned!"
          className="absolute top-8 left-4 animate-float"
          delay="0s"
        />
        
        <NotificationBubble 
          icon={<Check className="w-4 h-4" />}
          text="Money sent!"
          className="absolute top-4 right-4 animate-float"
          delay="0.5s"
          variant="success"
        />
        
        <NotificationBubble 
          icon={<Check className="w-4 h-4" />}
          text="Payment received!"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float"
          delay="1s"
        />
      </div>
      
      {/* tagline */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-semibold text-gray-800">
          We escalate transfer efficiency<br />
          and productivity
        </h2>
      </div>
      
      {/* partner logos */}
      <div className="flex items-center justify-center gap-8 opacity-60">
        <PartnerLogo name="Blooming" />
        <PartnerLogo name="BuildRight" />
        <PartnerLogo name="Flowbot" />
        <PartnerLogo name="EXPOR" />
        <PartnerLogo name="Relay" />
      </div>
    </section>
  )
}

// simple partner logo placeholder
function PartnerLogo({ name }) {
  return (
    <div className="flex items-center gap-2 text-gray-500">
      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
      <span className="text-sm font-medium">{name}</span>
    </div>
  )
}

export default HeroSection
