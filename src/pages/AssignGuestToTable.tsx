import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip'
import { ArrowLeft, Check, Bed, ForkKnife, X } from '@phosphor-icons/react'
import { useTables } from '@/context/TableContext'
import { useGuests } from '@/context/GuestContext'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

export default function AssignGuestToTable() {
  const { guestId } = useParams()
  const navigate = useNavigate()
  const { tables, assignGuestToTable } = useTables()
  const { guests, reloadGuests } = useGuests()
  const { toast } = useToast()
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const guest = guests.find(g => g.id === guestId)

  // Redirect if guest not found
  useEffect(() => {
    if (!guest && guests.length > 0) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono gościa",
        variant: "destructive"
      })
      navigate('/seating')
    }
  }, [guest, guests.length, navigate, toast])

  // Prepare tables data with occupancy
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
    if (!selectedTableId || !guest) return

    if (guest.rsvpStatus === 'declined') {
      toast({
        title: "Nie można przypisać",
        description: "Goście którzy odmówili udziału nie mogą być przypisani do stołów",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      await assignGuestToTable(guest.id, selectedTableId)
      
      // Reload guests to update table assignments
      await reloadGuests()
      
      toast({
        title: "Sukces",
        description: `${guest.firstName} ${guest.lastName} został przypisany do stołu`,
      })
      
      navigate('/seating')
    } catch (error) {
      console.error('Error assigning guest:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się przypisać gościa do stołu",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!guest) {
    return null
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/seating" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <button
            onClick={handleAssign}
            disabled={!selectedTableId || isLoading || guest.rsvpStatus === 'declined'}
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg disabled:opacity-50"
          >
            <Check size={24} weight="light" color="#FFFFFF" />
          </button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Przypisz do stołu</h1>
          <p className="text-muted-foreground font-barlow text-lg">Wybierz stół dla gościa</p>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div 
          className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/seating" 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Przypisz do stołu</h1>
          <p className="text-muted-foreground font-barlow text-lg">Wybierz stół dla gościa</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 pb-24 max-w-2xl">
        <div className="space-y-6">
          {/* Guest Details Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground font-cormorant">
                Szczegóły gościa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-primary/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-cormorant font-bold text-xl text-foreground">
                    {guest.firstName} {guest.lastName}
                  </h3>
                  <RSVPStatusChip status={guest.rsvpStatus} />
                </div>
                
                <div className="flex items-center gap-2">
                  {guest.accommodation && (
                    <Bed size={20} weight="light" className="text-primary" />
                  )}
                  {guest.dietaryRestrictions && (
                    <ForkKnife size={20} weight="light" className="text-primary" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Selection Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground font-cormorant">
                Wybierz stół
              </CardTitle>
            </CardHeader>
            <CardContent>
              {guest.rsvpStatus === 'declined' && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                  <p className="text-sm font-barlow text-destructive">
                    Goście którzy odmówili udziału nie mogą być przypisani do stołów
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => setSelectedTableId(table.id)}
                    disabled={!table.hasSpace || guest.rsvpStatus === 'declined'}
                    className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                      selectedTableId === table.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/30 hover:border-primary/50'
                    } ${
                      !table.hasSpace || guest.rsvpStatus === 'declined'
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-barlow font-semibold text-foreground">
                          {table.name}
                        </p>
                        <p className="text-sm text-muted-foreground font-barlow">
                          {table.assignedCount}/{table.seats} miejsc
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {table.hasSpace ? (
                          <Check size={20} weight="light" className="text-success" />
                        ) : (
                          <X size={20} weight="light" className="text-warning" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex gap-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/seating')}
              disabled={isLoading}
              className="flex-1 font-barlow"
            >
              Anuluj
            </Button>
            <Button 
              type="button"
              onClick={handleAssign}
              disabled={!selectedTableId || isLoading || guest.rsvpStatus === 'declined'}
              className="flex-1 font-barlow"
            >
              {isLoading ? "Zapisywanie..." : "Przypisz do stołu"}
            </Button>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex gap-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/seating')}
              disabled={isLoading}
              className="flex-1 font-barlow"
            >
              Anuluj
            </Button>
            <Button 
              type="button"
              onClick={handleAssign}
              disabled={!selectedTableId || isLoading || guest.rsvpStatus === 'declined'}
              className="flex-1 font-barlow"
            >
              {isLoading ? "..." : "Przypisz"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
