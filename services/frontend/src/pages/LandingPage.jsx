import { Link } from 'react-router-dom'
import { 
  LayoutDashboard, 
  PieChart, 
  Wallet, 
  Target,
  ArrowRight,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react'
import { Button } from '../components/common'

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-card-bg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-background" />
            </div>
            <span className="text-xl font-bold text-text-primary">Finance Tracker</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-text-secondary hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-text-secondary hover:text-primary transition-colors">How it Works</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Track All Your Accounts{' '}
              <span className="text-primary">In One Place</span>
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Get a complete view of your finances. Connect all your bank accounts, 
              track spending, set budgets, and reach your savings goals faster.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* hero image placeholder */}
          <div className="mt-16 relative animate-slide-up">
            <div className="bg-card-bg rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl">
              <div className="aspect-video bg-background rounded-lg flex items-center justify-center border border-text-muted/20">
                <div className="text-center">
                  <LayoutDashboard className="w-16 h-16 text-primary mx-auto mb-4" />
                  <p className="text-text-muted">Dashboard Preview</p>
                </div>
              </div>
            </div>
            {/* decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* features section */}
      <section id="features" className="py-20 px-6 bg-card-bg/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Powerful features to help you take control of your finances
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={<LayoutDashboard className="w-8 h-8" />}
              title="Unified Dashboard"
              description="See all your bank accounts, credit cards, and investments in one place"
            />
            <FeatureCard 
              icon={<PieChart className="w-8 h-8" />}
              title="Spending Analytics"
              description="Understand where your money goes with detailed charts and insights"
            />
            <FeatureCard 
              icon={<Wallet className="w-8 h-8" />}
              title="Budget Tracking"
              description="Set budgets for categories and get alerts when you're close to limits"
            />
            <FeatureCard 
              icon={<Target className="w-8 h-8" />}
              title="Savings Goals"
              description="Create savings goals and track your progress automatically"
            />
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              Get Started in Minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title="Create Account"
              description="Sign up for free in under a minute"
            />
            <StepCard 
              number="2"
              title="Connect Banks"
              description="Securely link your bank accounts"
            />
            <StepCard 
              number="3"
              title="Start Tracking"
              description="Get instant insights into your finances"
            />
          </div>
        </div>
      </section>

      {/* trust section */}
      <section className="py-20 px-6 bg-card-bg/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Bank-Level Security</h3>
              <p className="text-text-secondary">256-bit encryption keeps your data safe</p>
            </div>
            <div>
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Real-Time Sync</h3>
              <p className="text-text-secondary">Transactions update automatically</p>
            </div>
            <div>
              <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Smart Insights</h3>
              <p className="text-text-secondary">AI-powered spending analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* cta section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Ready to Take Control?
          </h2>
          <p className="text-text-secondary mb-8">
            Join thousands of users who are already managing their finances smarter.
          </p>
          <Link to="/register">
            <Button size="lg" className="gap-2">
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="py-8 px-6 border-t border-card-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-background" />
            </div>
            <span className="font-semibold text-text-primary">Finance Tracker</span>
          </div>
          <p className="text-text-muted text-sm">
            © 2024 Finance Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-card-bg rounded-xl p-6 hover:bg-card-hover transition-colors duration-200">
      <div className="w-14 h-14 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary text-sm">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-background font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}

export default LandingPage
