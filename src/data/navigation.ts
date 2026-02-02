import { 
  HouseSimple, 
  ListHeart, 
  PiggyBank, 
  Users,
  ForkKnife,
  Gear,
  Envelope
} from '@phosphor-icons/react'

export interface NavItem {
  to: string
  icon: any
  label: string
  group: 'main' | 'planning' | 'account'
}

export const navItems: NavItem[] = [
  { 
    to: '/dashboard', 
    icon: HouseSimple, 
    label: 'Dashboard',
    group: 'main'
  },
  { 
    to: '/tasks', 
    icon: ListHeart, 
    label: 'Lista zadań',
    group: 'planning'
  },
  { 
    to: '/budget', 
    icon: PiggyBank, 
    label: 'Budżet',
    group: 'planning'
  },
  { 
    to: '/guests', 
    icon: Users, 
    label: 'Lista gości',
    group: 'planning'
  },
  { 
    to: '/seating', 
    icon: ForkKnife, 
    label: 'Plan stołów',
    group: 'planning'
  },
  { 
    to: '/settings', 
    icon: Gear, 
    label: 'Ustawienia',
    group: 'account'
  },
  { 
    to: '/contact', 
    icon: Envelope, 
    label: 'Kontakt i pomoc',
    group: 'account'
  },
]

export const navGroups = {
  main: 'Główne',
  planning: 'Planowanie', 
  account: 'Konto'
}