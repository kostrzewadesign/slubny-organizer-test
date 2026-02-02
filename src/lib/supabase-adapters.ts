import { supabase } from '@/integrations/supabase/client';
import { logDbError } from './dbError';
import { BudgetAdapter } from './budget-adapter';
import { Expense as TaskExpense } from '@/context/TaskContext';

// ============================================
// AUTH HELPERS - Defense in depth security
// ============================================

// Supabase localStorage key (derived from project URL)
const SUPABASE_STORAGE_KEY = 'sb-irxrkutczxskuqbpgntd-auth-token';

// Wait for AuthContext to initialize auth (signaled via custom event)
let authContextReady = false;

// Listen for auth-ready event from AuthContext
if (typeof window !== 'undefined') {
  window.addEventListener('auth-context-ready', () => {
    console.log('✅ [supabase-adapters] Received auth-context-ready event');
    authContextReady = true;
  });
}

/**
 * Wait for auth to be ready (max 5 seconds)
 * AuthContext is the single source of truth for session initialization
 */
async function waitForAuthReady(): Promise<void> {
  if (authContextReady) {
    return;
  }

  console.log('🔐 [waitForAuthReady] Waiting for AuthContext to initialize...');

  // Wait up to 5 seconds for AuthContext
  for (let i = 0; i < 50; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (authContextReady) {
      console.log('✅ [waitForAuthReady] AuthContext is ready');
      return;
    }
  }

  console.warn('⚠️ [waitForAuthReady] Timeout waiting for AuthContext');
}

/**
 * Get authenticated user ID or return null (for read operations)
 *
 * Strategy:
 * 1. Read userId from localStorage (immediate)
 * 2. Ensure Supabase client auth is initialized (required for queries)
 * 3. Return userId
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  // Step 1: Get userId from localStorage (synchronous, never blocks)
  let userId: string | null = null;

  try {
    const storedSession = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      userId = parsed?.user?.id || null;
    }
  } catch (e) {
    console.warn('⚠️ [getAuthenticatedUserId] localStorage parse error:', e);
  }

  if (!userId) {
    console.warn('⚠️ [getAuthenticatedUserId] No user in localStorage');
    return null;
  }

  console.log('✅ [getAuthenticatedUserId] User from localStorage:', userId);

  // Step 2: Wait for AuthContext to initialize the Supabase client
  await waitForAuthReady();

  return userId;
}

/**
 * Require authenticated user ID (for write operations)
 * Throws error if no session - caller should propagate error
 */
async function requireAuthenticatedUserId(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Brak aktywnej sesji użytkownika');
  }
  return userId;
}

// ============================================
// TYPES
// ============================================

// Internal types for Supabase (matching actual database schema)
interface SupabaseExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  deposit_amount: number;
  payment_status: 'none' | 'paid' | 'deposit_paid' | 'deposit_only';
  note?: string;
  completed: boolean;
  paid_amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  isPriority: boolean;
  completed: boolean;
  taskType: 'wedding' | 'budget';
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  status: string;
  childAge?: number;
  rsvpStatus: 'pending' | 'confirmed' | 'declined' | 'attending' | 'sent';
  email?: string;
  phone?: string;
  accommodation: boolean;
  transport: boolean;
  dietaryRestrictions?: string;
  isChild: boolean;
  isServiceProvider: boolean;
  discountType?: string;
  companionOfGuestId?: string;
  tableAssignment?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  role?: 'bride' | 'groom' | 'guest' | 'vendor' | null;
  isLinkedToProfile?: boolean;
  specialIcon?: string | null;
}

export interface Table {
  id: string;
  name: string;
  tableType?: 'main_couple' | 'regular';
  seats: number;
  notes?: string;
  assignedGuestIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MAPPING HELPERS
// ============================================

// Helper functions to convert between Supabase and TaskContext types
const mapSupabaseExpenseToTaskExpense = (expense: SupabaseExpense): TaskExpense => ({
  id: expense.id,
  title: expense.title,
  category: expense.category,
  amount: expense.amount,
  isDeposit: Boolean(expense.deposit_amount && expense.deposit_amount > 0),
  paymentStatus: (expense.payment_status === 'paid' || expense.payment_status === 'deposit_paid' ? 'paid' : 'none') as 'none' | 'paid',
  note: expense.note,
  createdAt: new Date(expense.createdAt),
});

const mapTaskExpenseToSupabaseExpense = (expense: Partial<TaskExpense>): Partial<SupabaseExpense> => ({
  ...expense,
  deposit_amount: expense.isDeposit ? (expense.amount || 0) : 0,
  // Map paymentStatus correctly - never use "planned" which doesn't exist
  payment_status: (() => {
    if (expense.paymentStatus === 'paid') return 'paid';
    if (expense.isDeposit && expense.paymentStatus === 'none') return 'none'; // Can be deposit_paid later
    return 'none';
  })(),
  createdAt: typeof expense.createdAt === 'string' ? expense.createdAt : expense.createdAt?.toISOString(),
  updatedAt: typeof expense.updatedAt === 'string' ? expense.updatedAt : expense.updatedAt?.toISOString(),
});

// ============================================
// BUDGET ADAPTER
// ============================================

export class SupabaseBudgetAdapter implements BudgetAdapter {
  async getTotalBudget(): Promise<number> {
    console.log('[SupabaseBudgetAdapter] getTotalBudget called at', new Date().toISOString());

    const userId = await requireAuthenticatedUserId();
    console.log('[SupabaseBudgetAdapter] Querying budget for user:', userId);

    const queryPromise = supabase
      .from('user_profiles')
      .select('total_budget')
      .eq('user_id', userId)
      .maybeSingle();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Budget query timeout after 10s')), 10000);
    });

    let profile, error;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      profile = result.data;
      error = result.error;
      console.log('[SupabaseBudgetAdapter] Query completed:', { profile, error: error?.message });
    } catch (e: any) {
      console.error('[SupabaseBudgetAdapter] Query failed:', e.message);
      return 50000; // Return default on timeout
    }

    if (error) {
      logDbError('[SupabaseBudgetAdapter.getTotalBudget]', error);
      throw error;
    }

    return typeof profile?.total_budget === 'number' ? profile.total_budget : 50000;
  }

  async setTotalBudget(amount: number): Promise<void> {
    const userId = await requireAuthenticatedUserId();

    const { error } = await supabase
      .from('user_profiles')
      .update({ total_budget: amount })
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getExpenses(): Promise<TaskExpense[]> {
    console.log('[SupabaseBudgetAdapter] getExpenses called at', new Date().toISOString());
    
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      console.debug('[SupabaseBudgetAdapter] No session - returning empty list');
      return [];
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('[SupabaseBudgetAdapter.getExpenses]', error);
      throw error;
    }

    return data.map(expense => mapSupabaseExpenseToTaskExpense({
      id: expense.id,
      title: expense.title,
      category: expense.category,
      amount: Number(expense.amount),
      deposit_amount: Number(expense.deposit_amount || 0),
      payment_status: expense.payment_status as 'none' | 'paid' | 'deposit_paid' | 'deposit_only',
      note: expense.note,
      completed: expense.completed,
      paid_amount: Number(expense.paid_amount || 0),
      createdAt: expense.created_at,
      updatedAt: expense.updated_at,
    }));
  }

  async addExpense(expense: Omit<TaskExpense, 'id' | 'createdAt'>): Promise<TaskExpense> {
    const userId = await requireAuthenticatedUserId();

    const mapped = mapTaskExpenseToSupabaseExpense(expense);

    console.log('SupabaseBudgetAdapter: Adding expense with data:', {
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      isDeposit: expense.isDeposit,
      paymentStatus: expense.paymentStatus,
      mapped_payment_status: mapped.payment_status
    });

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        deposit_amount: expense.isDeposit ? expense.amount : 0,
        payment_status: mapped.payment_status || 'none',
        note: expense.note,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    return mapSupabaseExpenseToTaskExpense({
      id: data.id,
      title: data.title,
      category: data.category,
      amount: Number(data.amount),
      deposit_amount: Number(data.deposit_amount || 0),
      payment_status: data.payment_status as 'none' | 'paid' | 'deposit_paid' | 'deposit_only',
      note: data.note,
      completed: data.completed,
      paid_amount: Number(data.paid_amount || 0),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  async updateExpense(id: string, updates: Partial<TaskExpense>): Promise<TaskExpense> {
    const userId = await requireAuthenticatedUserId();
    
    const mapped = mapTaskExpenseToSupabaseExpense(updates);
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.isDeposit !== undefined) updateData.deposit_amount = updates.isDeposit ? updates.amount || 0 : 0;
    if (mapped.payment_status !== undefined) updateData.payment_status = mapped.payment_status;
    if (updates.note !== undefined) updateData.note = updates.note;

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Security: verify ownership
      .select()
      .single();

    if (error) throw error;

    return mapSupabaseExpenseToTaskExpense({
      id: data.id,
      title: data.title,
      category: data.category,
      amount: Number(data.amount),
      deposit_amount: Number(data.deposit_amount || 0),
      payment_status: data.payment_status as 'none' | 'paid' | 'deposit_paid' | 'deposit_only',
      note: data.note,
      completed: data.completed,
      paid_amount: Number(data.paid_amount || 0),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  async deleteExpense(id: string): Promise<void> {
    const userId = await requireAuthenticatedUserId();
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Security: verify ownership

    if (error) throw error;
  }
}

// ============================================
// TASK ADAPTER
// ============================================

export interface TaskAdapter {
  getTasks(): Promise<Task[]>;
  addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
}

export class SupabaseTaskAdapter implements TaskAdapter {
  async getTasks(): Promise<Task[]> {
    console.log('[SupabaseTaskAdapter] getTasks called at', new Date().toISOString());
    
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      console.debug('[SupabaseTaskAdapter] No session - returning empty list');
      return [];
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logDbError('[SupabaseTaskAdapter.getTasks]', error);
      throw error;
    }

    return data.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      category: task.category,
      isPriority: task.is_priority,
      completed: task.completed,
      taskType: task.task_type as 'wedding' | 'budget',
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }));
  }

  async addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const userId = await requireAuthenticatedUserId();

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: task.title,
        description: task.description,
        category: task.category,
        is_priority: task.isPriority,
        completed: task.completed,
        task_type: task.taskType,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      isPriority: data.is_priority,
      completed: data.completed,
      taskType: data.task_type as 'wedding' | 'budget',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const userId = await requireAuthenticatedUserId();
    
    const updateData: any = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isPriority !== undefined) updateData.is_priority = updates.isPriority;
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.taskType !== undefined) updateData.task_type = updates.taskType;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Security: verify ownership
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      isPriority: data.is_priority,
      completed: data.completed,
      taskType: data.task_type as 'wedding' | 'budget',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteTask(id: string): Promise<void> {
    const userId = await requireAuthenticatedUserId();
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Security: verify ownership

    if (error) throw error;
  }
}

// ============================================
// GUEST ADAPTER
// ============================================

export interface GuestAdapter {
  getGuests(): Promise<Guest[]>;
  addGuest(guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest>;
  updateGuest(id: string, updates: Partial<Guest>): Promise<Guest>;
  deleteGuest(id: string): Promise<void>;
}

export class SupabaseGuestAdapter implements GuestAdapter {
  async getGuests(): Promise<Guest[]> {
    console.log('[SupabaseGuestAdapter] getGuests called at', new Date().toISOString());

    const userId = await getAuthenticatedUserId();

    if (!userId) {
      console.debug('[SupabaseGuestAdapter] No session - returning empty list');
      return [];
    }

    console.log('[SupabaseGuestAdapter] Querying guests for user:', userId);

    // Add timeout to detect hanging queries
    const queryPromise = supabase
      .from('guests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Guest query timeout after 10s')), 10000);
    });

    let data, error;
    try {
      const result = await Promise.race([queryPromise, timeoutPromise]);
      data = result.data;
      error = result.error;
    } catch (e: any) {
      console.error('[SupabaseGuestAdapter] Query failed:', e.message);
      return [];
    }

    console.log('[SupabaseGuestAdapter] Query completed:', {
      success: !error,
      count: data?.length || 0,
      error: error?.message
    });

    if (error) {
      logDbError('[SupabaseGuestAdapter.getGuests]', error);
      throw error;
    }

    return data.map(guest => ({
      id: guest.id,
      firstName: guest.first_name,
      lastName: guest.last_name || '',
      group: guest.guest_group,
      status: guest.status,
      childAge: guest.child_age,
      rsvpStatus: guest.rsvp_status as 'pending' | 'confirmed' | 'declined' | 'attending' | 'sent',
      email: guest.email,
      phone: guest.phone,
      accommodation: guest.accommodation,
      transport: guest.transport,
      dietaryRestrictions: guest.dietary_restrictions,
      isChild: guest.is_child ?? false,
      isServiceProvider: guest.is_service_provider ?? false,
      discountType: guest.discount_type,
      companionOfGuestId: guest.companion_of_guest_id,
      tableAssignment: guest.table_assignment,
      notes: guest.notes,
      createdAt: guest.created_at,
      updatedAt: guest.updated_at,
      role: guest.role,
      isLinkedToProfile: guest.is_linked_to_profile,
      specialIcon: guest.special_icon,
    }));
  }

  async addGuest(guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest> {
    console.log('🔵 [SupabaseGuestAdapter] Adding guest:', { firstName: guest.firstName, lastName: guest.lastName });
    
    const userId = await requireAuthenticatedUserId();
    
    console.log('🔵 [SupabaseGuestAdapter] Auth state:', { userId: 'present' });

    // Validate required fields before DB insert
    const firstName = String(guest.firstName || '').trim();
    const lastName = String(guest.lastName || '').trim();
    
    if (!firstName) {
      throw new Error('Imię jest wymagane');
    }

    const payload = {
      user_id: userId,
      first_name: firstName,
      last_name: lastName || null,
      guest_group: guest.group || 'friends',
      status: guest.status || 'invited',
      child_age: guest.childAge,
      rsvp_status: guest.rsvpStatus || 'pending',
      email: guest.email || null,
      phone: guest.phone || null,
      accommodation: guest.accommodation ?? false,
      transport: guest.transport ?? false,
      dietary_restrictions: guest.dietaryRestrictions || null,
      is_child: guest.isChild ?? false,
      is_service_provider: guest.isServiceProvider ?? false,
      discount_type: guest.discountType || 'none',
      companion_of_guest_id: guest.companionOfGuestId || null,
      table_assignment: guest.tableAssignment || null,
      notes: guest.notes || null,
      role: guest.role || 'guest',
      is_linked_to_profile: guest.isLinkedToProfile ?? false,
      special_icon: guest.specialIcon || null,
    };

    try {
      const { data, error, status } = await supabase
        .from('guests')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[SupabaseGuestAdapter] insert failed:', {
          status,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      
      console.log('✅ [SupabaseGuestAdapter] Guest added successfully');
      return this.mapSupabaseGuestToGuest(data);
      
    } catch (insertError: any) {
      console.error('🔴 [SupabaseGuestAdapter] Insert error:', insertError.message);
      throw insertError;
    }
  }

  private mapSupabaseGuestToGuest(data: any): Guest {
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      group: data.guest_group,
      status: data.status,
      childAge: data.child_age,
      rsvpStatus: data.rsvp_status as 'pending' | 'confirmed' | 'declined' | 'attending' | 'sent',
      email: data.email,
      phone: data.phone,
      accommodation: data.accommodation,
      transport: data.transport,
      dietaryRestrictions: data.dietary_restrictions,
      isChild: data.is_child ?? false,
      isServiceProvider: data.is_service_provider ?? false,
      discountType: data.discount_type,
      companionOfGuestId: data.companion_of_guest_id,
      tableAssignment: data.table_assignment,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateGuest(id: string, updates: Partial<Guest>): Promise<Guest> {
    const userId = await requireAuthenticatedUserId();
    
    const updateData: any = {};
    
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
    if (updates.group !== undefined) updateData.guest_group = updates.group;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.childAge !== undefined) updateData.child_age = updates.childAge;
    if (updates.rsvpStatus !== undefined) updateData.rsvp_status = updates.rsvpStatus;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.accommodation !== undefined) updateData.accommodation = updates.accommodation;
    if (updates.transport !== undefined) updateData.transport = updates.transport;
    if (updates.dietaryRestrictions !== undefined) updateData.dietary_restrictions = updates.dietaryRestrictions;
    if (updates.isChild !== undefined) updateData.is_child = updates.isChild;
    if (updates.isServiceProvider !== undefined) updateData.is_service_provider = updates.isServiceProvider;
    if (updates.discountType !== undefined) updateData.discount_type = updates.discountType;
    if (updates.companionOfGuestId !== undefined) updateData.companion_of_guest_id = updates.companionOfGuestId;
    if (updates.tableAssignment !== undefined) updateData.table_assignment = updates.tableAssignment;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.role !== undefined) updateData.role = updates.role;

    const { data, error } = await supabase
      .from('guests')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Security: verify ownership
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      group: data.guest_group,
      status: data.status,
      childAge: data.child_age,
      rsvpStatus: data.rsvp_status as 'pending' | 'confirmed' | 'declined' | 'attending' | 'sent',
      email: data.email,
      phone: data.phone,
      accommodation: data.accommodation,
      transport: data.transport,
      dietaryRestrictions: data.dietary_restrictions,
      isChild: data.is_child,
      isServiceProvider: data.is_service_provider,
      discountType: data.discount_type,
      companionOfGuestId: data.companion_of_guest_id,
      tableAssignment: data.table_assignment,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      role: data.role,
      isLinkedToProfile: data.is_linked_to_profile,
      specialIcon: data.special_icon,
    };
  }

  async deleteGuest(id: string): Promise<void> {
    const userId = await requireAuthenticatedUserId();
    
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Security: verify ownership

    if (error) throw error;
  }
}

// ============================================
// TABLE ADAPTER
// ============================================

export interface TableAdapter {
  getTables(): Promise<Table[]>;
  getCoupleTable(): Promise<Table | null>;
  addTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'assignedGuestIds'>): Promise<Table>;
  updateTable(id: string, updates: Partial<Table>): Promise<Table>;
  deleteTable(id: string): Promise<void>;
  assignGuestToTable(guestId: string, tableId: string): Promise<void>;
  removeGuestFromTable(guestId: string): Promise<void>;
  getTableAssignments(): Promise<{ guest_id: string; table_id: string }[]>;
}

export class SupabaseTableAdapter implements TableAdapter {
  async getTables(): Promise<Table[]> {
    console.log('[SupabaseTableAdapter] getTables called at', new Date().toISOString());
    
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      console.debug('[SupabaseTableAdapter] No session - returning empty list');
      return [];
    }
    
    const [tablesResult, assignmentsResult] = await Promise.all([
      supabase
        .from('tables')
        .select('*')
        .eq('user_id', userId) // Security: mandatory user_id filter
        .order('created_at', { ascending: false }),
      supabase
        .from('table_assignments')
        .select('guest_id, table_id')
        .eq('user_id', userId) // Security: mandatory user_id filter
    ]);

    if (tablesResult.error) {
      logDbError('[SupabaseTableAdapter.getTables]', tablesResult.error);
      throw tablesResult.error;
    }
    if (assignmentsResult.error) {
      logDbError('[SupabaseTableAdapter.getTableAssignments]', assignmentsResult.error);
      throw assignmentsResult.error;
    }

    const assignments = assignmentsResult.data || [];
    
    return tablesResult.data.map(table => ({
      id: table.id,
      name: table.name,
      seats: table.seats,
      notes: table.notes,
      tableType: table.table_type || 'regular',
      assignedGuestIds: assignments
        .filter(a => a.table_id === table.id)
        .map(a => a.guest_id),
      createdAt: table.created_at,
      updatedAt: table.updated_at,
    }));
  }

  async getCoupleTable(): Promise<Table | null> {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      console.debug('[SupabaseTableAdapter] No session - returning null for couple table');
      return null;
    }
    
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('user_id', userId)
      .eq('table_type', 'main_couple')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('[SupabaseTableAdapter] Error getting couple table:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Get assignments for this table
    const { data: assignments } = await supabase
      .from('table_assignments')
      .select('guest_id')
      .eq('table_id', data.id)
      .eq('user_id', userId);
    
    return {
      id: data.id,
      name: data.name,
      seats: data.seats,
      notes: data.notes,
      tableType: data.table_type || 'regular',
      assignedGuestIds: assignments?.map(a => a.guest_id) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async addTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'assignedGuestIds'>): Promise<Table> {
    const userId = await requireAuthenticatedUserId();

    const { data, error } = await supabase
      .from('tables')
      .insert({
        user_id: userId,
        name: table.name,
        seats: table.seats,
        table_type: table.tableType || 'regular',
        notes: table.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      tableType: data.table_type || 'regular',
      seats: data.seats,
      notes: data.notes,
      assignedGuestIds: [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async updateTable(id: string, updates: Partial<Table>): Promise<Table> {
    const userId = await requireAuthenticatedUserId();
    
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.seats !== undefined) updateData.seats = updates.seats;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // Security: verify ownership
      .select()
      .single();

    if (error) throw error;

    // Get assignments for this table (with user_id filter)
    const { data: assignments } = await supabase
      .from('table_assignments')
      .select('guest_id')
      .eq('table_id', id)
      .eq('user_id', userId); // Security: verify ownership

    return {
      id: data.id,
      name: data.name,
      seats: data.seats,
      notes: data.notes,
      tableType: data.table_type || 'regular',
      assignedGuestIds: assignments?.map(a => a.guest_id) || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async deleteTable(id: string): Promise<void> {
    const userId = await requireAuthenticatedUserId();
    
    // First remove all assignments (with user_id filter)
    await supabase
      .from('table_assignments')
      .delete()
      .eq('table_id', id)
      .eq('user_id', userId);
    
    // Then delete the table (with user_id filter)
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id)
      .eq('user_id', userId); // Security: verify ownership

    if (error) throw error;
  }

  async assignGuestToTable(guestId: string, tableId: string): Promise<void> {
    const userId = await requireAuthenticatedUserId();

    // Remove existing assignment (with user_id filter)
    await supabase
      .from('table_assignments')
      .delete()
      .eq('guest_id', guestId)
      .eq('user_id', userId);

    // Add new assignment
    const { error } = await supabase
      .from('table_assignments')
      .insert({
        user_id: userId,
        guest_id: guestId,
        table_id: tableId,
      });

    if (error) throw error;

    // Update guest table_assignment field (with user_id filter)
    await supabase
      .from('guests')
      .update({ table_assignment: tableId })
      .eq('id', guestId)
      .eq('user_id', userId);
  }

  async removeGuestFromTable(guestId: string): Promise<void> {
    const userId = await requireAuthenticatedUserId();
    
    await supabase
      .from('table_assignments')
      .delete()
      .eq('guest_id', guestId)
      .eq('user_id', userId); // Security: verify ownership

    // Clear guest table_assignment field (with user_id filter)
    await supabase
      .from('guests')
      .update({ table_assignment: null })
      .eq('id', guestId)
      .eq('user_id', userId); // Security: verify ownership
  }

  async getTableAssignments(): Promise<{ guest_id: string; table_id: string }[]> {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      console.debug('[SupabaseTableAdapter] No session - returning empty assignments');
      return [];
    }
    
    const { data, error } = await supabase
      .from('table_assignments')
      .select('guest_id, table_id')
      .eq('user_id', userId); // Security: mandatory user_id filter

    if (error) {
      logDbError('[SupabaseTableAdapter.getTableAssignments]', error);
      throw error;
    }
    
    return data;
  }
}

// ============================================
// EXPORTED ADAPTER INSTANCES
// ============================================

export const budgetAdapter = new SupabaseBudgetAdapter();
export const taskAdapter = new SupabaseTaskAdapter();
export const guestAdapter = new SupabaseGuestAdapter();
export const tableAdapter = new SupabaseTableAdapter();
