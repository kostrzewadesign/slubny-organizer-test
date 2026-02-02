import { supabase } from '@/integrations/supabase/client'
import { withTimeout, retry } from '@/utils/fetchWithRetry'

export async function fetchBudgetSummary(userId: string) {
  return withTimeout(
    retry(async () => {
      const { data, error } = await supabase.rpc('budget_summary', { 
        p_user_id: userId 
      })
      if (error) throw error
      return data[0] || { total: 0, paid: 0, remaining: 0, deposit_paid: 0 }
    }),
    30000
  )
}

export async function fetchExpensesPage(userId: string, page: number, pageSize: number) {
  const from = page * pageSize
  const to = from + pageSize - 1
  
  return withTimeout(
    retry(async () => {
      const { data, error, count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)
      
      if (error) throw error
      return { data: data || [], count: count || 0 }
    }),
    30000
  )
}

// Direct INSERT fallback when RPC fails
async function addGuestDirectly(userId: string, guest: any, companion?: any) {
  console.log('🟡 [optimizedApi] Using direct INSERT fallback');
  
  // Generate ID for main guest
  const guestId = crypto.randomUUID();
  
  // Prepare guest data for direct insert
  const guestData = {
    id: guestId,
    user_id: userId,
    first_name: guest.first_name,
    last_name: guest.last_name,
    email: guest.email || null,
    phone: guest.phone || null,
    guest_group: guest.guest_group || 'family',
    rsvp_status: guest.rsvp_status || 'pending',
    accommodation: guest.accommodation || false,
    transport: guest.transport || false,
    dietary_restrictions: guest.dietary_restrictions || null,
    notes: guest.notes || null,
    is_child: guest.is_child || false,
    is_service_provider: guest.is_service_provider || false,
    discount_type: guest.discount_type || 'none'
  };
  
  // Insert main guest
  const { data: guestResult, error: guestError } = await supabase
    .from('guests')
    .insert(guestData)
    .select()
    .single();
    
  if (guestError) {
    console.error('🔴 [optimizedApi] Direct guest insert failed:', guestError);
    throw guestError;
  }
  
  // Insert companion if provided
  if (companion) {
    const companionData = {
      id: crypto.randomUUID(),
      user_id: userId,
      first_name: companion.first_name,
      last_name: companion.last_name,
      email: companion.email || null,
      phone: companion.phone || null,
      guest_group: companion.guest_group || guest.guest_group || 'family',
      rsvp_status: companion.rsvp_status || 'pending',
      accommodation: companion.accommodation || false,
      transport: companion.transport || false,
      dietary_restrictions: companion.dietary_restrictions || null,
      notes: companion.notes || null,
      companion_of_guest_id: guestId,
      is_child: companion.is_child || false,
      is_service_provider: companion.is_service_provider || false,
      discount_type: companion.discount_type || 'none'
    };
    
    const { error: companionError } = await supabase
      .from('guests')
      .insert(companionData);
      
    if (companionError) {
      console.error('🔴 [optimizedApi] Direct companion insert failed:', companionError);
      throw companionError;
    }
  }
  
  return { guest_id: guestId, success: true };
}

export async function addGuestWithCompanion(userId: string | null, guest: any, companion?: any) {
  console.log('🔵 [optimizedApi] addGuestWithCompanion called:', { 
    hasUserId: !!userId, 
    guestName: `${guest.first_name} ${guest.last_name}`
  });
  
  // Require userId - database constraint requires it
  if (!userId) {
    throw new Error('User ID is required for guest creation');
  }
  
  // Validate required guest fields
  if (!guest.first_name?.trim() || !guest.last_name?.trim()) {
    throw new Error('Imię i nazwisko są wymagane');
  }
  
  // Ensure no null values for required fields
  const sanitizedGuest = {
    ...guest,
    first_name: String(guest.first_name || '').trim(),
    last_name: String(guest.last_name || '').trim(),
  };
  
  const sanitizedCompanion = companion ? {
    ...companion,
    first_name: String(companion.first_name || '').trim(),
    last_name: String(companion.last_name || '').trim(),
  } : null;
  
  return withTimeout(
    retry(async () => {
      try {
        // Try RPC first
        const { data, error, status } = await supabase.rpc('add_guest_with_companion', {
          p_user_id: userId,
          p_guest: sanitizedGuest,
          p_companion: sanitizedCompanion
        });
        
        if (error) {
          console.warn('🟡 [optimizedApi] RPC failed, trying direct INSERT:', {
            status,
            code: error.code,
            message: error.message
          });
          
          // Fallback to direct INSERT if RPC fails
          return await addGuestDirectly(userId, sanitizedGuest, sanitizedCompanion);
        }
        
        console.log('✅ [optimizedApi] Guest added via RPC:', data);
        return data;
        
      } catch (rpcError) {
        console.warn('🟡 [optimizedApi] RPC error, using fallback:', rpcError);
        // Use direct INSERT as fallback
        return await addGuestDirectly(userId, sanitizedGuest, sanitizedCompanion);
      }
    }),
    15000
  )
}