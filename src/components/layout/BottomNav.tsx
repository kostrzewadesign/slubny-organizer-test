import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navItems } from '@/data/navigation'

const bottomNavItems = [
  { 
    to: '/dashboard', 
    icon: navItems.find(item => item.to === '/dashboard')?.icon,
    label: 'Home' 
  },
  { 
    to: '/tasks', 
    icon: navItems.find(item => item.to === '/tasks')?.icon,
    label: 'Zadania' 
  },
  { 
    to: '/budget', 
    icon: navItems.find(item => item.to === '/budget')?.icon,
    label: 'Budżet' 
  },
  { 
    to: '/guests', 
    icon: navItems.find(item => item.to === '/guests')?.icon,
    label: 'Goście' 
  },
  { 
    to: '/seating', 
    icon: navItems.find(item => item.to === '/seating')?.icon,
    label: 'Stoły' 
  },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white px-2 py-2 md:hidden z-50">
      <div className="flex justify-around">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 p-2 transition-colors transition-transform duration-200 active:scale-95 min-w-0 flex-1',
                isActive
                  ? 'text-black'
                  : 'text-[hsl(73,55%,33%)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon weight="light" className="h-6 w-6" style={{ strokeWidth: '3px' }} />
                <span className="text-xs font-normal truncate w-full text-center">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}