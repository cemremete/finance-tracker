import Sidebar from '../components/landing/Sidebar'
import HeroSection from '../components/landing/HeroSection'
import StatsSection from '../components/landing/StatsSection'
import FeaturesSection from '../components/landing/FeaturesSection'

function Landing() {
  return (
    <div className="flex min-h-screen">
      {/* left sidebar - sticky */}
      <Sidebar />
      
      {/* main content area */}
      <main className="flex-1 bg-white overflow-y-auto">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
      </main>
    </div>
  )
}

export default Landing
