import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip'
import { Table } from '@/context/TableContext'
import { Guest } from '@/context/GuestContext'
import { cn } from '@/lib/utils'

interface TableCardProps {
  table: Table
  assignedGuests: Guest[]
  onClick: (table: Table) => void
  className?: string
  style?: React.CSSProperties
}

export function TableCard({ table, assignedGuests, onClick, className, style }: TableCardProps) {
  return (
    <Card 
      onClick={() => onClick(table)}
      className={cn("shadow-card hover:shadow-card-hover transition-transform transition-shadow duration-300 cursor-pointer select-none", className)}
      style={style}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-foreground font-cormorant">
          <span className="truncate">{table.name}</span>
          <span className="text-sm font-barlow text-muted-foreground">
            {assignedGuests.length}/{table.seats}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {assignedGuests.map((guest) => (
            <div key={guest.id} className="flex items-center justify-between">
              <span className="font-barlow text-foreground">{guest.firstName} {guest.lastName}</span>
              <RSVPStatusChip status={guest.rsvpStatus} />
            </div>
          ))}
          {Array.from({ length: table.seats - assignedGuests.length }).map((_, index) => (
            <div key={`empty-${index}`} className="flex items-center justify-between">
              <span className="font-barlow text-muted-foreground italic">Puste miejsce</span>
              <span className="text-xs text-muted-foreground">—</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}