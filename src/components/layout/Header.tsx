import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, Settings } from 'lucide-react'
import { List } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  // TODO: [Etap 2] - pobieranie danych użytkownika z Supabase
  const daysToWedding = 127 // placeholder
  const weddingDate = "15 sierpnia 2025" // placeholder
  
  return (
    <header className="hidden md:block bg-white px-4 py-3 md:bg-background md:border-b md:border-border">
      <div className="flex items-center justify-between">
        {/* Mobile: Only hamburger menu */}
        <div className="md:hidden w-full flex justify-end">
          <Button variant="ghost" size="icon" onClick={onMenuToggle}>
            <List weight="light" className="h-6 w-6 text-black" style={{ strokeWidth: '3px' }} />
          </Button>
        </div>


        {/* Desktop: User actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt="Para młoda" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              A&M
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}