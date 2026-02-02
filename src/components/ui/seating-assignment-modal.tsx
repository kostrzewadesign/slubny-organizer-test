import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGuests, type Guest, guestGroupLabels } from '@/context/GuestContext';
import { useTables, type Table } from '@/context/TableContext';
import { seatingAdapter } from '@/lib/seating-adapter';
import { useToast } from '@/hooks/use-toast';
import { MagnifyingGlass, Table as TableIcon } from '@phosphor-icons/react';
import divider from '@/assets/divider.png';

interface SeatingAssignmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Scenario 1: Empty seat clicked (pick guest)
  preselectedTableId?: string | null;
  preselectedSeatIndex?: number | null;
  // Scenario 2: Unassigned guest clicked (pick table)
  preselectedGuestId?: string | null;
}

export function SeatingAssignmentModal({
  isOpen,
  onOpenChange,
  preselectedTableId,
  preselectedSeatIndex,
  preselectedGuestId
}: SeatingAssignmentModalProps) {
  const { guests, reloadGuests } = useGuests();
  const { tables, getTableById } = useTables();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(preselectedGuestId || null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(preselectedTableId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine mode: pick-guest or pick-table
  const mode = preselectedTableId !== undefined && preselectedTableId !== null ? 'pick-guest' : 'pick-table';
  
  // Reset state when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedGuestId(preselectedGuestId || null);
      setSelectedTableId(preselectedTableId || null);
      setIsSubmitting(false);
    } else {
      setSelectedGuestId(preselectedGuestId || null);
      setSelectedTableId(preselectedTableId || null);
    }
  }, [isOpen, preselectedGuestId, preselectedTableId]);

  // Get unassigned guests (for scenario 1)
  const unassignedGuests = useMemo(() => {
    return guests.filter(g => 
      !g.tableAssignment && 
      g.rsvpStatus !== 'declined'
    ).sort((a, b) => {
      const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [guests]);

  // Get tables with capacity info (for scenario 2)
  const tablesWithCapacity = useMemo(() => {
    return tables.map(table => {
      const assignedGuests = guests.filter(g => g.tableAssignment === table.id);
      const freeSeats = table.seats - assignedGuests.length;
      const isCoupleTable = table.name === 'Stół Pary Młodej' || table.name === 'Para Młoda';
      
      return {
        ...table,
        freeSeats,
        isFull: freeSeats <= 0,
        isCoupleTable
      };
    }).sort((a, b) => {
      // Pin couple table at top
      if (a.isCoupleTable && !b.isCoupleTable) return -1;
      if (!a.isCoupleTable && b.isCoupleTable) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [tables, guests]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (mode === 'pick-guest') {
      if (!query) return unassignedGuests;
      return unassignedGuests.filter(guest =>
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(query)
      );
    } else {
      if (!query) return tablesWithCapacity;
      return tablesWithCapacity.filter(table =>
        table.name.toLowerCase().includes(query)
      );
    }
  }, [mode, searchQuery, unassignedGuests, tablesWithCapacity]);

  // Handle assignment
  const handleAssign = async () => {
    if (isSubmitting) return;

    // Validation
    if (mode === 'pick-guest') {
      if (!selectedGuestId) {
        toast({
          title: "Wybierz gościa",
          description: "Musisz wybrać gościa z listy",
          variant: "destructive"
        });
        return;
      }
      
      // Check if selected guest has declined
      const selectedGuest = guests.find(g => g.id === selectedGuestId);
      if (selectedGuest?.rsvpStatus === 'declined') {
        toast({
          title: "Nie można przypisać gościa",
          description: "Ten gość odmówił udziału w weselu",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedTableId || preselectedSeatIndex === null || preselectedSeatIndex === undefined) {
        toast({
          title: "Błąd",
          description: "Brak informacji o miejscu",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!selectedTableId) {
        toast({
          title: "Wybierz stół",
          description: "Musisz wybrać stół z listy",
          variant: "destructive"
        });
        return;
      }
      if (!selectedGuestId) {
        toast({
          title: "Błąd",
          description: "Brak informacji o gościu",
          variant: "destructive"
        });
        return;
      }
      
      // Check if preselected guest has declined
      const preselectedGuest = guests.find(g => g.id === selectedGuestId);
      if (preselectedGuest?.rsvpStatus === 'declined') {
        toast({
          title: "Nie można przypisać gościa",
          description: "Ten gość odmówił udziału w weselu",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let finalSeatIndex: number;
      
      if (mode === 'pick-guest') {
        // Scenario 1: use preselected seat
        finalSeatIndex = preselectedSeatIndex!;
      } else {
        // Scenario 2: find first free seat
        const table = getTableById(selectedTableId);
        if (!table) {
          throw new Error('Nie znaleziono stołu');
        }
        
        const freeSeat = await seatingAdapter.findFirstFreeSeat(selectedTableId, table.seats);
        if (freeSeat === null) {
          toast({
            title: "Stół pełny",
            description: "Ten stół nie ma już wolnych miejsc",
            variant: "destructive"
          });
          return;
        }
        finalSeatIndex = freeSeat;
      }

      // Optimistically update UI (you can add optimistic updates to context if needed)
      
      // Perform assignment
      await seatingAdapter.assignGuestToSeat(selectedGuestId, selectedTableId, finalSeatIndex);
      
      // Reload data
      await reloadGuests();
      
      toast({
        title: "Przypisano",
        description: "Gość został przypisany do stołu"
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning guest to seat:', error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się przypisać gościa",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === 'Enter' && !isSubmitting) {
        handleAssign();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, selectedGuestId, selectedTableId]);

  const currentGuest = useMemo(() => {
    if (!preselectedGuestId) return null;
    return guests.find(g => g.id === preselectedGuestId) || null;
  }, [preselectedGuestId, guests]);

  const currentTable = useMemo(() => {
    if (!preselectedTableId) return null;
    return getTableById(preselectedTableId) || null;
  }, [preselectedTableId, getTableById]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md font-barlow">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-3xl">
            {mode === 'pick-guest' ? 'Wybierz gościa' : 'Wybierz stół'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {mode === 'pick-guest' 
              ? `Przypisz gościa do miejsca ${(preselectedSeatIndex || 0) + 1} przy stole "${currentTable?.name}"`
              : `Przypisz "${currentGuest?.firstName} ${currentGuest?.lastName}" do stołu`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Divider */}
        <div className="flex justify-center my-2">
          <img src={divider} alt="" className="w-full max-w-md opacity-60" />
        </div>

        {/* Search - only for pick-table mode */}
        {mode === 'pick-table' && (
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj stołu..."
              className="pl-10"
              autoFocus
            />
          </div>
        )}

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {mode === 'pick-guest' ? (
            // Guest list - simple list without search
            unassignedGuests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Brak nieprzypisanych gości
              </div>
            ) : (
              unassignedGuests.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => setSelectedGuestId(guest.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedGuestId === guest.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </div>
                    {guest.group && (
                      <div className="text-sm text-muted-foreground">
                        {guestGroupLabels[guest.group] || guest.group}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nie znaleziono stołów
            </div>
          ) : (
            // Table list
            (filteredItems as (typeof tablesWithCapacity)[0][]).map((table) => {
              const isDisabled = table.isFull;
              
              return (
                <button
                  key={table.id}
                  onClick={() => !isDisabled && setSelectedTableId(table.id)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isDisabled 
                      ? 'opacity-50 cursor-not-allowed border-border bg-muted/20'
                      : selectedTableId === table.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                  }`}
                  title={isDisabled ? 'Brak wolnych miejsc' : ''}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      table.isCoupleTable ? 'bg-primary/30' : 'bg-primary/20'
                    }`}>
                      <TableIcon size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {table.name}
                        {table.isCoupleTable && (
                          <span className="text-xs bg-primary text-white px-2 py-0.5 rounded">
                            Para Młoda
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {table.freeSeats > 0 
                          ? `${table.freeSeats} ${table.freeSeats === 1 ? 'wolne miejsce' : 'wolne miejsca'}`
                          : 'Brak wolnych miejsc'
                        } • {table.seats - table.freeSeats}/{table.seats} zajętych
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleAssign}
            className="flex-1"
            disabled={
              isSubmitting ||
              (mode === 'pick-guest' ? !selectedGuestId : !selectedTableId)
            }
          >
            {isSubmitting ? 'Przypisywanie...' : 'Przypisz'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
