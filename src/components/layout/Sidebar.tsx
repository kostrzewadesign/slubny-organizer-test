import { NavLink } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems, navGroups } from '@/data/navigation'

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r border-border h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary fill-current" />
          <div>
            <h1 className="font-cormorant text-xl font-bold">ŚlubnyOrganizer</h1>
            <p className="text-sm text-muted-foreground">Planner ślubu</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {/* Main */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {navGroups.main}
          </h3>
          <div className="space-y-1">
            {navItems
              .filter(item => item.group === 'main')
              .map((item) => (
                <SidebarNavItem key={item.to} item={item} />
              ))}
          </div>
        </div>

        {/* Planning */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {navGroups.planning}
          </h3>
          <div className="space-y-1">
            {navItems
              .filter(item => item.group === 'planning')
              .map((item) => (
                <SidebarNavItem key={item.to} item={item} />
              ))}
          </div>
        </div>


        {/* Account */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {navGroups.account}
          </h3>
          <div className="space-y-1">
            {navItems
              .filter(item => item.group === 'account')
              .map((item) => (
                <SidebarNavItem key={item.to} item={item} />
              ))}
          </div>
        </div>
      </nav>
    </aside>
  )
}

function SidebarNavItem({ item }: { item: typeof navItems[0] }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-wedding focus-wedding',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-card-foreground hover:bg-accent hover:text-accent-foreground'
        )
      }
    >
      <item.icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  )
}