import { supabase } from '@/integrations/supabase/client';

export interface SeatAssignment {
  guestId: string;
  tableId: string;
  seatIndex: number;
}

/**
 * Seating adapter for precise seat assignment operations
 */
export const seatingAdapter = {
  /**
   * Assign guest to specific seat at table
   * @param guestId - Guest ID
   * @param tableId - Table ID
   * @param seatIndex - Seat position (0-based index)
   */
  async assignGuestToSeat(guestId: string, tableId: string, seatIndex: number): Promise<void> {
    console.log('🔄 assignGuestToSeat:', { guestId, tableId, seatIndex });
    
    // Validate seat is not already taken
    const { data: existingGuest, error: checkError } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .eq('table_assignment', tableId)
      .eq('seat_index', seatIndex)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking seat availability:', checkError);
      throw new Error('Nie udało się sprawdzić dostępności miejsca');
    }
    
    if (existingGuest && existingGuest.id !== guestId) {
      throw new Error('To miejsce jest już zajęte');
    }
    
    // Update guest with table and seat assignment
    const { error } = await supabase
      .from('guests')
      .update({
        table_assignment: tableId,
        seat_index: seatIndex
      })
      .eq('id', guestId);
    
    if (error) {
      console.error('Error assigning guest to seat:', error);
      throw new Error('Nie udało się przypisać gościa do miejsca');
    }
    
    console.log('✅ Guest assigned to seat successfully');
  },
  
  /**
   * Unassign guest from their current seat
   */
  async unassignGuest(guestId: string): Promise<void> {
    const { error } = await supabase
      .from('guests')
      .update({
        table_assignment: null,
        seat_index: null
      })
      .eq('id', guestId);
    
    if (error) {
      console.error('Error unassigning guest:', error);
      throw new Error('Nie udało się usunąć przypisania gościa');
    }
  },
  
  /**
   * Get all guests assigned to a specific table
   */
  async getTableGuests(tableId: string): Promise<Array<{ id: string; seat_index: number | null }>> {
    const { data, error } = await supabase
      .from('guests')
      .select('id, seat_index')
      .eq('table_assignment', tableId)
      .order('seat_index', { ascending: true, nullsFirst: false });
    
    if (error) {
      console.error('Error fetching table guests:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Find first available seat index for a table
   * @param tableId - Table ID
   * @param totalSeats - Total number of seats at the table
   * @returns First free seat index or null if table is full
   */
  async findFirstFreeSeat(tableId: string, totalSeats: number): Promise<number | null> {
    const assignedGuests = await this.getTableGuests(tableId);
    const occupiedIndices = new Set(
      assignedGuests
        .map(g => g.seat_index)
        .filter((idx): idx is number => idx !== null)
    );
    
    for (let i = 0; i < totalSeats; i++) {
      if (!occupiedIndices.has(i)) {
        return i;
      }
    }
    
    return null; // Table is full
  },
  
  /**
   * Validate seat assignment
   */
  async validateSeatAssignment(tableId: string, seatIndex: number, totalSeats: number): Promise<{
    valid: boolean;
    error?: string;
  }> {
    // Check if seat index is within bounds
    if (seatIndex < 0 || seatIndex >= totalSeats) {
      return {
        valid: false,
        error: `Nieprawidłowy numer miejsca (0-${totalSeats - 1})`
      };
    }
    
    // Check if seat is already occupied
    const { data: existingGuest } = await supabase
      .from('guests')
      .select('id')
      .eq('table_assignment', tableId)
      .eq('seat_index', seatIndex)
      .maybeSingle();
    
    if (existingGuest) {
      return {
        valid: false,
        error: 'To miejsce jest już zajęte'
      };
    }
    
    return { valid: true };
  }
};
