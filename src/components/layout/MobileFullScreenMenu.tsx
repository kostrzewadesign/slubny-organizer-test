import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { navItems, navGroups } from '@/data/navigation'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

interface MobileFullScreenMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileFullScreenMenu({ isOpen, onClose }: MobileFullScreenMenuProps) {
  const navigate = useNavigate()

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleNavigation = (to: string) => {
    navigate(to)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu */}
      <div 
        className="fixed top-0 left-0 right-0 bottom-0 bg-white z-50 md:hidden animate-fade-in flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          height: '100dvh', // Dynamic viewport height for better mobile support
          overscrollBehavior: 'contain',
          touchAction: 'pan-y'
        }}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Ślubny Organizer" className="h-8" />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            aria-label="Zamknij menu"
          >
            <X weight="light" className="h-6 w-6 text-black" style={{ strokeWidth: '3px' }} />
          </Button>
        </div>

        {/* Menu Content - Scrollable */}
        <nav 
          className="overflow-y-auto overflow-x-hidden p-4 pb-32" 
          style={{ 
            height: 'calc(100dvh - 73px)', // Subtract header height
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            paddingBottom: 'max(128px, env(safe-area-inset-bottom, 32px) + 96px)'
          }}
        >
          <div className="space-y-8">
            {/* Main */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {navGroups.main}
              </h3>
              <div className="space-y-2">
                {navItems
                  .filter(item => item.group === 'main')
                  .map((item) => (
                    <MobileNavItem key={item.to} item={item} onNavigate={handleNavigation} />
                  ))}
              </div>
            </div>

            {/* Planning */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {navGroups.planning}
              </h3>
              <div className="space-y-2">
                {navItems
                  .filter(item => item.group === 'planning')
                  .map((item) => (
                    <MobileNavItem key={item.to} item={item} onNavigate={handleNavigation} />
                  ))}
              </div>
            </div>


            {/* Account */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                {navGroups.account}
              </h3>
              <div className="space-y-2">
                {navItems
                  .filter(item => item.group === 'account')
                  .map((item) => (
                    <MobileNavItem key={item.to} item={item} onNavigate={handleNavigation} />
                  ))}
              </div>
              <Separator className="mt-6" />
            </div>
          </div>
        </nav>
      </div>
    </>
  )
}

interface MobileNavItemProps {
  item: typeof navItems[0]
  onNavigate: (to: string) => void
}

function MobileNavItem({ item, onNavigate }: MobileNavItemProps) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-4 px-4 py-3 rounded-lg transition-wedding focus-wedding min-h-[48px]',
          isActive
            ? 'text-black font-medium bg-accent/50'
            : 'text-black hover:bg-accent/30'
        )
      }
      onClick={(e) => {
        e.preventDefault()
        onNavigate(item.to)
      }}
    >
      <item.icon weight="light" className="h-6 w-6 text-black" style={{ strokeWidth: '3px' }} />
      <span className="text-base font-normal text-black">{item.label}</span>
    </NavLink>
  )
}