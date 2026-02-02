import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TableCard } from '@/components/ui/table-card'
import { ArrowLeft, Plus, Table, Users, Bed, ForkKnife, CheckCircle, XCircle, CaretDown, Car, Baby, Briefcase, Tag, UserPlus } from '@phosphor-icons/react'
import { Heart } from 'lucide-react'
import divider from '@/assets/divider.png'

import { useTables } from '@/context/TableContext'
import { useGuests, guestGroupLabels, Guest } from '@/context/GuestContext'
import { useState, useEffect } from 'react'
import { SeatingAssignmentModal } from '@/components/ui/seating-assignment-modal'

export default function Seating() {
  const navigate = useNavigate()
  const { tables, getTotalSeats, getOccupiedSeats } = useTables()
  const { guests, attendingGuestsCount } = useGuests()
  
  // Seating assignment modal state (nowy modal + seatIndex)
  const [isSeatingAssignmentModalOpen, setIsSeatingAssignmentModalOpen] = useState(false)
  const [preselectedTableId, setPreselectedTableId] = useState<string | null>(null)
  const [preselectedSeatIndex, setPreselectedSeatIndex] = useState<number | null>(null)
  const [preselectedGuestId, setPreselectedGuestId] = useState<string | null>(null)

  // State for accordion sections
  const [expandedTables, setExpandedTables] = useState<string[]>([])

  // Filter out declined guests for seating calculations
  const attendingGuests = guests.filter(guest => guest.rsvpStatus !== 'declined')
  
  // Find the couple's table - prioritize one with assignments and newest
  const coupleTable = tables
    .filter(t => t.name === 'Stół Pary Młodej' || t.name === 'Para Młoda')
    .sort((a, b) => {
      // First, prioritize tables with assignments
      if (a.assignedGuestIds.length > 0 && b.assignedGuestIds.length === 0) return -1;
      if (a.assignedGuestIds.length === 0 && b.assignedGuestIds.length > 0) return 1;
      // Then, prioritize newer tables
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })[0]; // Take the first one after sorting

  // Show couple's table + any other tables (excluding duplicate couple tables)
  const visibleTables = coupleTable
    ? [coupleTable, ...tables.filter(t => t.id !== coupleTable.id && t.name !== 'Stół Pary Młodej' && t.name !== 'Para Młoda')]
    : tables;
  
  // Get assigned guests count (only attending guests)
  const assignedGuestsCount = attendingGuests.filter(guest => guest.tableAssignment).length
  const unassignedGuestsCount = attendingGuestsCount - assignedGuestsCount

  // Group unassigned guests by their group (exclude declined)
  const unassignedGuestsByGroup = attendingGuests
    .filter(guest => !guest.tableAssignment)
    .reduce((acc, guest) => {
      const groupKey = guest.group
      if (!acc[groupKey]) {
        acc[groupKey] = []
      }
      acc[groupKey].push(guest)
      return acc
    }, {} as Record<string, typeof guests>)

  // Get declined guests (separate section)
  const declinedGuests = guests.filter(guest => guest.rsvpStatus === 'declined')

  // Get guests assigned to a specific table
  const getGuestsForTable = (tableId: string) => {
    const assigned = guests.filter(guest => guest.tableAssignment === tableId);
    // Debug logging removed to prevent console flooding
    return assigned;
  }

  // Set default expanded section on first load - only couple's table
  useEffect(() => {
    const saved = localStorage.getItem('seating-expanded-tables');
    if (saved) {
      setExpandedTables(JSON.parse(saved));
    } else {
      // Default to only couple's table expanded on first visit
      const defaultTable = coupleTable
        ? [coupleTable.id]
        : visibleTables.slice(0, 1).map(t => t.id); // First table if couple table doesn't exist
      setExpandedTables(defaultTable);
    }
  }, []); // Run only once on mount

  const handleAccordionChange = (values: string[]) => {
    setExpandedTables(values);
    localStorage.setItem('seating-expanded-tables', JSON.stringify(values));
  };

  // Debug logging removed - was causing excessive re-renders
  // useEffect(() => {
  //   console.log('🔍 [Seating] Data from contexts:', { ... });
  // }, [guests, tables]);

  const handleTableLongPress = (table: any) => {
    navigate(`/seating/edit/${table.id}`)
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none animate-float"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/dashboard" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <Link
            to="/seating/new"
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95"
          >
            <Plus size={24} weight="light" color="#FFFFFF" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3 animate-fade-in">Plan stołów</h1>
          <p className="text-muted-foreground font-barlow text-lg animate-fade-in">Rozmieśćcie gości przy stołach</p>
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
            to="/dashboard" 
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <Link
            to="/seating/new"
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm"
          >
            <Plus size={24} weight="light" color="#FFFFFF" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Plan stołów</h1>
          <p className="text-muted-foreground font-barlow text-lg">Rozmieśćcie gości przy stołach</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 space-y-6">
        {/* Stats Summary */}
        <div className="bg-transparent mb-8">
          <div className="pb-4 text-center">
            <p className="text-sm font-barlow text-muted-foreground mb-1">Liczba miejsc przy stołach</p>
            <h3 className="text-4xl font-cormorant text-foreground font-bold">
              {getTotalSeats()}
            </h3>
          </div>
          <div className="pt-0 space-y-6">
            {/* Table Stats */}
            <div className="flex justify-between items-center">
              {/* Tables Count */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="text-3xl font-cormorant font-bold text-foreground">{visibleTables.length}</div>
                <div className="text-xs font-barlow text-muted-foreground">Stoły</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-border mx-3"></div>
              
              {/* Assigned Guests */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="text-3xl font-cormorant font-bold text-success">{assignedGuestsCount}</div>
                <div className="text-xs font-barlow text-muted-foreground">Przypisani</div>
              </div>
              
              {/* Separator */}
              <div className="w-px h-12 bg-border mx-3"></div>
              
              {/* Unassigned Guests */}
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="text-3xl font-cormorant font-bold text-warning">{unassignedGuestsCount}</div>
                <div className="text-xs font-barlow text-muted-foreground">Nieprzypisani</div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center my-8">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Tables Section */}
        <Accordion 
          type="multiple" 
          value={expandedTables}
          onValueChange={handleAccordionChange}
          className="space-y-6"
        >
          {visibleTables.map((table) => {
            const assignedGuests = getGuestsForTable(table.id)
            
            // Sort guests: bride first, then groom, then others
            const sortedGuests = [...assignedGuests].sort((a, b) => {
              if (a.role === 'bride') return -1;
              if (b.role === 'bride') return 1;
              if (a.role === 'groom') return -1;
              if (b.role === 'groom') return 1;
              return 0;
            })
            
            return (
              <AccordionItem key={table.id} value={table.id} className="border-none">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                  <div className="flex items-center justify-between w-full pr-4">
                    <h2 
                      className="text-xl font-cormorant font-semibold text-left text-foreground flex items-center gap-2"
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleTableLongPress(table);
                      }}
                      onTouchStart={(e) => {
                        const timer = setTimeout(() => {
                          handleTableLongPress(table);
                        }, 500);
                        
                        const cleanup = () => {
                          clearTimeout(timer);
                          document.removeEventListener('touchend', cleanup);
                          document.removeEventListener('touchcancel', cleanup);
                        };
                        
                        document.addEventListener('touchend', cleanup);
                        document.addEventListener('touchcancel', cleanup);
                      }}
                    >
                      {(table.name === 'Stół Pary Młodej' || table.name === 'Para Młoda') && <Heart className="w-5 h-5 text-primary" />}
                      {table.name}
                    </h2>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-barlow text-muted-foreground">
                        {assignedGuests.length}/{table.seats}
                      </span>
                      <CaretDown 
                        size={20} 
                        weight="light" 
                        className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" 
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-3 pb-0 px-0">
                  <div className="space-y-2 mb-2">
                    {/* Assigned guests */}
                    {sortedGuests.map((guest) => (
                      <Card 
                        key={guest.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          guest.rsvpStatus === 'confirmed' 
                            ? '!shadow-none !border-0 border-transparent' 
                            : 'shadow-card hover:shadow-card-hover'
                        }`}
                        style={guest.rsvpStatus === 'confirmed' ? { backgroundColor: 'hsla(73, 51%, 94%, 0.4)' } : undefined}
                        onClick={() => navigate(`/seating/assign/${guest.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                 <span className="font-barlow text-base text-foreground">
                                   {(guest.role === 'bride' || guest.role === 'groom') && '❤️ '}
                                   {guest.firstName}{guest.lastName ? ` ${guest.lastName}` : ''}
                                 </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {guest.accommodation && (
                                  <Bed size={16} weight="light" className="text-primary" />
                                )}
                                {guest.transport && (
                                  <Car size={16} weight="light" className="text-primary" />
                                )}
                                {guest.dietaryRestrictions && (
                                  <ForkKnife size={16} weight="light" className="text-primary" />
                                )}
                                {guest.isChild && (
                                  <Baby size={16} weight="light" className="text-primary" />
                                )}
                                {guest.isServiceProvider && (
                                  <Briefcase size={16} weight="light" className="text-primary" />
                                )}
                                {guest.discountType && guest.discountType !== 'none' && (
                                  <Tag size={16} weight="light" className="text-primary" />
                                )}
                                {guest.companionOfGuestId && (
                                  <UserPlus size={16} weight="light" className="text-primary" />
                                )}
                              </div>
                            </div>
                            
                            <RSVPStatusChip status={guest.rsvpStatus} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Empty seats */}
                    {Array.from({ length: table.seats - assignedGuests.length }).map((_, index) => (
                      <div 
                        key={`empty-${index}`}
                        className="rounded-2xl p-4 border border-dashed border-border/30 cursor-pointer hover:border-primary/50 transition-all duration-200"
                        onClick={() => {
                          const assignedGuests = getGuestsForTable(table.id);
                          const seatIndex = assignedGuests.length; // pierwszy wolny indeks
                          setPreselectedTableId(table.id);
                          setPreselectedSeatIndex(seatIndex);
                          setPreselectedGuestId(null);
                          setIsSeatingAssignmentModalOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-barlow text-sm text-muted-foreground">
                            Puste miejsce
                          </span>
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus size={14} weight="light" className="text-primary" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
        
        {/* Add New Table Card */}
        <Card 
          className="cursor-pointer transition-all duration-200 !shadow-none !border-0 border-transparent bg-transparent mt-6"
          onClick={() => navigate('/seating/new')}
        >
          <CardContent className="p-2">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Plus size={18} weight="light" />
              <span className="font-barlow text-sm">
                Dodaj stół
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Unassigned Guests Section */}
        <div className="space-y-6 mb-8 mt-8">
          {/* Divider */}
          <div className="flex justify-center my-8">
            <img src={divider} alt="" className="w-full max-w-md" />
          </div>

          {/* Section Header */}
          <div className="pb-4">
            <h2 className="text-2xl font-cormorant font-bold text-foreground text-center">Nieprzypisani goście</h2>
          </div>
          
          {Object.keys(unassignedGuestsByGroup).length > 0 ? (
            <Accordion type="multiple" defaultValue={Object.keys(unassignedGuestsByGroup)} className="w-full space-y-6">
              {Object.entries(unassignedGuestsByGroup).map(([groupKey, groupGuests]) => (
                <AccordionItem key={groupKey} value={groupKey} className="border-0">
                    <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                      <div className="w-full py-4">
                         <h2 className="flex items-center justify-between text-foreground font-cormorant text-left">
                           <span className="text-xl font-cormorant font-semibold text-left transition-colors duration-200 break-words leading-tight text-foreground">
                             {guestGroupLabels[groupKey] || groupKey}
                           </span>
                           <div className="flex items-center gap-2">
                             <span className="text-sm font-barlow text-muted-foreground">
                               {groupGuests.length}
                             </span>
                            <CaretDown 
                              size={16} 
                              weight="light" 
                              className="text-muted-foreground transition-transform duration-200 [&[data-state=open]]:rotate-180" 
                            />
                          </div>
                        </h2>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-0 px-0">
                      <div className="space-y-2 mb-2">
                        {groupGuests.map((guest) => (
                          <div 
                            key={guest.id}
                            className="rounded-2xl p-4 shadow-card hover:shadow-card-hover transition-wedding border border-border/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <span className="font-barlow text-foreground font-medium">
                                   {(guest.role === 'bride' || guest.role === 'groom') && '❤️ '}
                                   {guest.firstName}{guest.lastName ? ` ${guest.lastName}` : ''}
                                 </span>
                                <div className="flex gap-1">
                                  {guest.accommodation && (
                                    <Bed size={16} weight="light" className="text-primary" />
                                  )}
                                  {guest.dietaryRestrictions && (
                                    <ForkKnife size={16} weight="light" className="text-primary" />
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <RSVPStatusChip status={guest.rsvpStatus} />
                                <button
                                  onClick={() => {
                                    setPreselectedGuestId(guest.id);
                                    setPreselectedTableId(null);
                                    setPreselectedSeatIndex(null);
                                    setIsSeatingAssignmentModalOpen(true);
                                  }}
                                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                                >
                                  <Plus size={16} weight="light" className="text-primary" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                     </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground font-barlow">Wszyscy goście zostali przypisani do stołów</p>
            </div>
          )}
        </div>

        {/* Declined Guests Section */}
        {declinedGuests.length > 0 && (
          <div className="space-y-6 mb-8 mt-8">
            {/* Divider */}
            <div className="flex justify-center my-8">
              <img src={divider} alt="" className="w-full max-w-md opacity-50" />
            </div>

            {/* Section Header */}
            <div className="pb-4">
              <h2 className="text-2xl font-cormorant font-bold text-foreground/60 text-center flex items-center justify-center gap-2">
                <XCircle size={24} weight="light" className="text-danger/60" />
                Odmówili udziału
              </h2>
              <p className="text-sm text-muted-foreground text-center mt-1 font-barlow">
                {declinedGuests.length} {declinedGuests.length === 1 ? 'osoba' : declinedGuests.length < 5 ? 'osoby' : 'osób'}
              </p>
            </div>
            
            <div className="space-y-2">
              {declinedGuests.map((guest) => (
                <div 
                  key={guest.id}
                  className="rounded-2xl p-4 border border-border/20 bg-muted/20 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="font-barlow text-foreground/70">
                         {guest.firstName}{guest.lastName ? ` ${guest.lastName}` : ''}
                       </span>
                      <span className="text-xs text-muted-foreground font-barlow">
                        {guestGroupLabels[guest.group] || guest.group}
                      </span>
                    </div>
                    
                    <RSVPStatusChip status={guest.rsvpStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Seating Assignment Modal */}
      <SeatingAssignmentModal
        isOpen={isSeatingAssignmentModalOpen}
        onOpenChange={(open) => {
          setIsSeatingAssignmentModalOpen(open);
          if (!open) {
            setPreselectedTableId(null);
            setPreselectedSeatIndex(null);
            setPreselectedGuestId(null);
          }
        }}
        preselectedTableId={preselectedTableId}
        preselectedSeatIndex={preselectedSeatIndex}
        preselectedGuestId={preselectedGuestId}
      />
    </div>
  )
}