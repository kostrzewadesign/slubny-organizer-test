import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'
import { navItems, navGroups } from '@/data/navigation'
import { cn } from '@/lib/utils'
import divider from '@/assets/divider.png'

export default function Menu() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none" 
          style={{ backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)` }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/dashboard" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">
            Menu
          </h1>
          <p className="text-muted-foreground font-barlow text-lg">
            Zarządzaj Waszym ślubem
          </p>
        </div>
      </div>

      {/* Menu Content */}
      <div className="relative z-10 container mx-auto px-4 space-y-8 pb-32">
        {/* Main Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {navGroups.main}
          </h3>
          <div className="space-y-2">
            {navItems
              .filter(item => item.group === 'main')
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-lg transition-wedding focus-wedding min-h-[48px]',
                    'text-black hover:bg-accent/30'
                  )}
                >
                  <item.icon weight="light" className="h-6 w-6 text-black" style={{ strokeWidth: '3px' }} />
                  <span className="text-base font-normal text-black">{item.label}</span>
                </Link>
              ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Planning Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {navGroups.planning}
          </h3>
          <div className="space-y-2">
            {navItems
              .filter(item => item.group === 'planning')
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-lg transition-wedding focus-wedding min-h-[48px]',
                    'text-black hover:bg-accent/30'
                  )}
                >
                  <item.icon weight="light" className="h-6 w-6 text-black" style={{ strokeWidth: '3px' }} />
                  <span className="text-base font-normal text-black">{item.label}</span>
                </Link>
              ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Account Section */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            {navGroups.account}
          </h3>
          <div className="space-y-2">
            {navItems
              .filter(item => item.group === 'account')
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-lg transition-wedding focus-wedding min-h-[48px]',
                    'text-black hover:bg-accent/30'
                  )}
                >
                  <item.icon weight="light" className="h-6 w-6 text-black" style={{ strokeWidth: '3px' }} />
                  <span className="text-base font-normal text-black">{item.label}</span>
                </Link>
              ))}
          </div>
          <Separator className="mt-6" />
        </div>
      </div>
    </div>
  )
}
