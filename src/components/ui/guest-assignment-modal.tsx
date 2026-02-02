import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip'
import { Table, Users, Check, X } from '@phosphor-icons/react'
import { useTables } from '@/context/TableContext'
import { useGuests, Guest } from '@/context/GuestContext'
import { useToast } from '@/hooks/use-toast'

interface GuestAssignmentModalProps {
  guest: Guest | null
  preselectedTableId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GuestAssignmentModal({ guest, preselectedTableId, open, onOpenChange }: GuestAssignmentModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(preselectedTableId || null)
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { tables, assignGuestToTable } = useTables()
  const { guests } = useGuests()
  const { toast } = useToast()

  // Get unassigned guests (excluding declined)
  const unassignedGuests = guests.filter(g => 
    !g.tableAssignment && 
    g.rsvpStatus !== 'declined'
  )

  if (!guest && unassignedGuests.length === 0) return null
  
  const currentGuest = guest || (selectedGuestId ? guests.find(g => g.id === selectedGuestId) : null) || null
  
  if (!currentGuest) return null

  // Get available tables with capacity info
  const availableTables = tables.map(table => {
    const assignedGuestsCount = guests.filter(g => g.tableAssignment === table.id).length
    const hasSpace = assignedGuestsCount < table.seats
    return {
      ...table,
      assignedCount: assignedGuestsCount,
      hasSpace
    }
  })

  const handleAssign = async () => {
    // Sprawdź czy user wybrał gościa (w Scenariuszu 1)
    if (!guest && !selectedGuestId) {
      toast({
        title: "Wybierz gościa",
        description: "Musisz wybrać gościa z listy",
        variant: "destructive"
      })
      return
    }

    if (!selectedTableId || !currentGuest) return

    // Block assignment for declined guests
    if (currentGuest.rsvpStatus === 'declined') {
      toast({
        title: "Nie można przypisać",
        description: "Goście którzy odmówili udziału nie mogą być przypisani do stołów",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('🎯 Assigning guest to table:', { guestId: currentGuest.id, tableId: selectedTableId })
      
      // Only use TableContext for assignment - single source of truth
      await assignGuestToTable(currentGuest.id, selectedTableId)
      
      const selectedTable = tables.find(t => t.id === selectedTableId)
      
      console.log('✅ Guest successfully assigned to table')
      
      onOpenChange(false)
      setSelectedTableId(null)
      setSelectedGuestId(null)
    } catch (error) {
      console.error('❌ Error assigning guest to table:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się przypisać gościa do stołu",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setSelectedTableId(preselectedTableId || null)
    setSelectedGuestId(null)
  }

  // Reset selected table when preselectedTableId changes
  if (preselectedTableId !== null && selectedTableId !== preselectedTableId) {
    setSelectedTableId(preselectedTableId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-cormorant text-xl">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              {guest ? (
                <Table size={16} weight="light" className="text-primary" />
              ) : (
                <Users size={16} weight="light" className="text-primary" />
              )}
            </div>
            {guest ? 'Przypisz do stołu' : 'Przypisz gościa'}
          </DialogTitle>
          <DialogDescription className="font-barlow">
            {guest ? 'Wybierz stół dla gościa' : 'Wybierz gościa i stół'}
          </DialogDescription>
        </DialogHeader>

        {/* Guest Selection (if opened from empty seat) */}
        {!guest && unassignedGuests.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-barlow font-medium text-foreground">
              Wybierz gościa
            </label>
            <Select 
              value={selectedGuestId || ""} 
              onValueChange={setSelectedGuestId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wybierz gościa..." />
              </SelectTrigger>
              <SelectContent>
                {unassignedGuests.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-barlow">
                        {g.firstName} {g.lastName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Guest Info */}
        <div className="bg-primary/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-barlow font-semibold text-foreground">
                {currentGuest.firstName} {currentGuest.lastName}
              </h3>
              <p className="text-sm text-muted-foreground font-barlow">
                {currentGuest.group}
              </p>
            </div>
            <RSVPStatusChip status={currentGuest.rsvpStatus} />
          </div>
          
          {(currentGuest.accommodation || currentGuest.dietaryRestrictions) && (
            <div className="flex gap-2 items-center">
              {currentGuest.accommodation && (
                <Badge variant="secondary" className="text-xs">
                  Nocleg
                </Badge>
              )}
              {currentGuest.dietaryRestrictions && (
                <Badge variant="secondary" className="text-xs">
                  Dieta specjalna
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Table Selection */}
        <div className="space-y-3">
          <label className="text-sm font-barlow font-medium text-foreground">
            Wybierz stół
          </label>
          
          {currentGuest.rsvpStatus === 'declined' && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm font-barlow text-destructive">
                Goście którzy odmówili udziału nie mogą być przypisani do stołów
              </p>
            </div>
          )}
          
          <Select 
            value={selectedTableId || ""} 
            onValueChange={setSelectedTableId}
            disabled={currentGuest.rsvpStatus === 'declined'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={
                currentGuest.rsvpStatus === 'declined' 
                  ? "Gość odmówił udziału" 
                  : "Wybierz stół..."
              } />
            </SelectTrigger>
            <SelectContent>
              {availableTables.map((table) => (
                <SelectItem 
                  key={table.id} 
                  value={table.id}
                  disabled={!table.hasSpace}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-barlow">
                      {table.name}
                    </span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-xs font-barlow ${
                        table.hasSpace ? 'text-muted-foreground' : 'text-warning'
                      }`}>
                        {table.assignedCount}/{table.seats}
                      </span>
                      {table.hasSpace ? (
                        <Check size={12} weight="light" className="text-success" />
                      ) : (
                        <X size={12} weight="light" className="text-warning" />
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
              {availableTables.length === 0 && (
                <SelectItem value="" disabled>
                  Brak dostępnych stołów
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {selectedTableId && (
            <div className="bg-muted/50 rounded-lg p-3">
              {(() => {
                const selectedTable = availableTables.find(t => t.id === selectedTableId)
                if (!selectedTable) return null
                
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users size={14} weight="light" className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-barlow font-medium text-foreground">
                        {selectedTable.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-barlow">
                        {selectedTable.assignedCount + 1}/{selectedTable.seats} miejsc po przypisaniu
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              !selectedTableId || 
              isLoading || 
              !currentGuest ||
              currentGuest.rsvpStatus === 'declined' ||
              (!guest && !selectedGuestId)
            }
            className="flex-1"
          >
            {isLoading ? "Przypisywanie..." : "Przypisz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}