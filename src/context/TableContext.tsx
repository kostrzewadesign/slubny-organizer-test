import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { tableAdapter } from '@/lib/supabase-adapters';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { TableInputSchema } from '@/lib/table-validation';
import { toast } from '@/hooks/use-toast';

export interface Table {
  id: string;
  name: string;
  seats: number;
  notes?: string;
  tableType?: 'main_couple' | 'regular';
  assignedGuestIds: string[];
  createdAt: Date;
  updatedAt?: Date;
}

interface TableContextType {
  tables: Table[];
  loading: boolean;
  addTable: (table: Omit<Table, 'id' | 'assignedGuestIds' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTable: (id: string, updates: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  assignGuestToTable: (guestId: string, tableId: string | null) => Promise<void>;
  removeGuestFromTable: (guestId: string) => Promise<void>;
  getTableById: (id: string) => Table | undefined;
  getAssignedGuestsCount: () => number;
  getTotalSeats: () => number;
  getOccupiedSeats: () => number;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

interface TableProviderProps {
  children: React.ReactNode;
}

export function useTables(): TableContextType {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTables must be used within a TableProvider');
  }
  return context;
}

// Default template data for seating plan
const defaultTables: Table[] = [
  {
    id: 'couple-table-template',
    name: 'Stół Pary Młodej',
    seats: 6,
    notes: 'Stół dla Pary Młodej i najbliższych osób',
    assignedGuestIds: [],
    createdAt: new Date(),
  }
];

export function TableProvider({ children }: TableProviderProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, authReady } = useAuth();
  const isInitializingCoupleTable = useRef(false);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  const initializeCoupleTable = async () => {
    // Prevent concurrent initialization
    if (isInitializingCoupleTable.current) {
      console.log('Couple table initialization already in progress, skipping...');
      return;
    }

    // Defensive check: must have user
    if (!user) {
      console.debug('[TableContext] No user - skipping couple table init');
      return;
    }

    isInitializingCoupleTable.current = true;
    
    try {
      // Check if couple table already exists by table_type (not by name!)
      const existingCoupleTable = await tableAdapter.getCoupleTable();
      
      if (existingCoupleTable) {
        console.log('✅ Couple table already exists (table_type=main_couple), skipping initialization');
        return;
      }
      
      console.log('🔄 Creating couple table - none with table_type=main_couple found');
      
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('bride_first_name, bride_last_name, groom_first_name, groom_last_name')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      // Create the couple's table with table_type='main_couple'
      const coupleTableData = {
        name: 'Stół Pary Młodej',
        seats: 6,
        notes: 'Stół dla Pary Młodej i najbliższych osób',
        tableType: 'main_couple' as const
      };
      
      const newTable = await tableAdapter.addTable(coupleTableData);

      // Check if couple exists as guests
      const { data: guests } = await supabase
        .from('guests')
        .select('id, first_name, last_name, table_assignment')
        .eq('user_id', user.id);

      if (!guests) return;

      // Find or create bride
      let bride = guests.find(g => 
        g.first_name?.toLowerCase() === profile.bride_first_name?.toLowerCase() && 
        g.last_name?.toLowerCase() === profile.bride_last_name?.toLowerCase()
      );

      if (!bride && profile.bride_first_name && profile.bride_last_name) {
        const { data: newBride } = await supabase
          .from('guests')
          .insert({
            user_id: user.id,
            first_name: profile.bride_first_name,
            last_name: profile.bride_last_name,
            guest_group: 'family',
            rsvp_status: 'confirmed',
            table_assignment: newTable.id
          })
          .select()
          .single();
        bride = newBride || undefined;
      } else if (bride && !bride.table_assignment) {
        await tableAdapter.assignGuestToTable(bride.id, newTable.id);
      }

      // Find or create groom
      let groom = guests.find(g => 
        g.first_name?.toLowerCase() === profile.groom_first_name?.toLowerCase() && 
        g.last_name?.toLowerCase() === profile.groom_last_name?.toLowerCase()
      );

      if (!groom && profile.groom_first_name && profile.groom_last_name) {
        await supabase
          .from('guests')
          .insert({
            user_id: user.id,
            first_name: profile.groom_first_name,
            last_name: profile.groom_last_name,
            guest_group: 'family',
            rsvp_status: 'confirmed',
            table_assignment: newTable.id
          });
      } else if (groom && !groom.table_assignment) {
        await tableAdapter.assignGuestToTable(groom.id, newTable.id);
      }

      // Reload tables after initialization
      const data = await tableAdapter.getTables();
      const tablesWithCorrectTypes = data.map(table => ({
        ...table,
        createdAt: new Date(table.createdAt),
        updatedAt: table.updatedAt ? new Date(table.updatedAt) : undefined
      }));
      
      const sortedTables = [...tablesWithCorrectTypes].sort((a, b) => {
        const aIsCouple = a.tableType === 'main_couple';
        const bIsCouple = b.tableType === 'main_couple';
        
        if (aIsCouple && !bIsCouple) return -1;
        if (!aIsCouple && bIsCouple) return 1;
        
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      
      setTables(sortedTables);
    } catch (error) {
      console.error('Error initializing couple table:', error);
      
      toast({
        title: "Błąd inicjalizacji stołu pary młodej",
        description: "Nie udało się utworzyć domyślnego stołu. Spróbuj odświeżyć stronę.",
        variant: "destructive",
        duration: 4000
      });
    } finally {
      isInitializingCoupleTable.current = false;
    }
  };


  const loadTables = useCallback(async () => {
    if (!user) {
      setTables(defaultTables);
      setLoading(false);
      return;
    }

    try {
      // Session is already ready (authReady === true), no need to wait
      
      const data = await tableAdapter.getTables();
      const tablesWithCorrectTypes = data.map(table => ({
        ...table,
        createdAt: new Date(table.createdAt),
        updatedAt: table.updatedAt ? new Date(table.updatedAt) : undefined
      }));
      
      console.log('🔍 [TableContext] Load check:', {
        totalTables: tablesWithCorrectTypes.length,
        tables: tablesWithCorrectTypes.map(t => ({ 
          id: t.id, 
          name: t.name, 
          tableType: t.tableType,
          assignedGuestIds: t.assignedGuestIds,
          createdAt: t.createdAt 
        }))
      });
      
      if (tablesWithCorrectTypes.length === 0) {
        console.log('📝 [TableContext] No tables exist, initializing couple table');
        await initializeCoupleTable();
        // initializeCoupleTable() will call setTables, so we're done
      } else {
        // Check if couple table exists by table_type (not by name!)
        const coupleTableExists = tablesWithCorrectTypes.some(t => 
          t.tableType === 'main_couple'
        );
        
        if (!coupleTableExists) {
          console.log('📝 [TableContext] No couple table found (table_type=main_couple), creating it');
          await initializeCoupleTable();
          // initializeCoupleTable() will call setTables
        } else {
          console.log('✅ [TableContext] Couple table exists, setting tables:', {
            count: tablesWithCorrectTypes.length
          });
          
          // Sort: couple table first, then others by creation date
          const sortedTables = [...tablesWithCorrectTypes].sort((a, b) => {
            const aIsCouple = a.tableType === 'main_couple';
            const bIsCouple = b.tableType === 'main_couple';
            
            if (aIsCouple && !bIsCouple) return -1;
            if (!aIsCouple && bIsCouple) return 1;
            
            return a.createdAt.getTime() - b.createdAt.getTime();
          });
          
          console.log('🔄 [TableContext] Calling setTables with:', {
            count: sortedTables.length,
            coupleTable: sortedTables.find(t => t.tableType === 'main_couple')
          });
          setTables(sortedTables);
          console.log('✅ [TableContext] setTables called successfully');
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      setTables(defaultTables);
      
      toast({
        title: "Błąd wczytywania stołów",
        description: "Nie udało się wczytać listy stołów. Sprawdź połączenie internetowe i odśwież stronę.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('[TableContext] Effect triggered:', { authReady, userId: user?.id });
    
    // Wait for auth to be resolved
    if (!authReady) {
      console.log('[TableContext] Auth not ready');
      return;
    }
    
    // No user - use defaults
    if (!user) {
      console.log('[TableContext] No user - using defaults');
      setTables(defaultTables);
      setLoading(false);
      lastLoadedUserIdRef.current = null;
      return;
    }
    
    // Skip if already loaded for this user
    if (lastLoadedUserIdRef.current === user.id) {
      console.log('[TableContext] Already loaded for user');
      return;
    }
    
    lastLoadedUserIdRef.current = user.id;
    loadTables();
    
  }, [authReady, user?.id, loadTables]);

  // Realtime subscriptions for tables and table_assignments
  useEffect(() => {
    if (!authReady || !user) return;
    
    console.log('🔄 [TableContext] Setting up realtime subscriptions for user:', user.id);
    
    // Subscribe to table changes
    const tableSubscription = supabase
      .channel('tables-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tables', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 [TableContext] Table changed:', payload);
          loadTables();
        }
      )
      .subscribe();
      
    // Subscribe to assignment changes
    const assignmentSubscription = supabase
      .channel('table-assignments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'table_assignments', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('🔄 [TableContext] Assignment changed:', payload);
          loadTables();
        }
      )
      .subscribe();
    
    console.log('✅ [TableContext] Realtime subscriptions established');
    
    return () => {
      console.log('🔌 [TableContext] Unsubscribing from realtime channels');
      tableSubscription.unsubscribe();
      assignmentSubscription.unsubscribe();
    };
  }, [user]);

  const addTable = async (tableData: Omit<Table, 'id' | 'assignedGuestIds' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('TableContext: Adding table with data:', tableData);
      
      // Validate input with zod schema
      const validation = TableInputSchema.safeParse(tableData);
      
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        console.error('[TableContext] Validation failed:', validation.error);
        throw new Error(`Błąd walidacji: ${errorMessages}`);
      }
      
      // Type assertion: zod validates required fields
      const validatedData = validation.data as { name: string; seats: number; notes?: string };
      
      console.log('TableContext: Transformed data for adapter:', validatedData);
      const newTable = await tableAdapter.addTable(validatedData);
      console.log('TableContext: Successfully added table:', newTable);
      
      // Optimistic update: add to existing state instead of reloading all tables
      setTables(prev => {
        // Normalize dates from server response
        const tableWithCorrectTypes = {
          ...newTable,
          createdAt: new Date(newTable.createdAt),
          updatedAt: newTable.updatedAt ? new Date(newTable.updatedAt) : undefined
        };
        
        // Add to existing tables
        const updatedTables = [...prev, tableWithCorrectTypes];
        
        // Sort: couple table first, then others by creation date
        const sortedTables = updatedTables.sort((a, b) => {
          const aIsCouple = a.tableType === 'main_couple';
          const bIsCouple = b.tableType === 'main_couple';
          
          if (aIsCouple && !bIsCouple) return -1;
          if (!aIsCouple && bIsCouple) return 1;
          
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
        
        return sortedTables;
      });
    } catch (error) {
      console.error('TableContext: Error adding table:', error);
      
      toast({
        title: "Błąd dodawania stołu",
        description: "Nie udało się dodać stołu. Sprawdź poprawność danych i spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    try {
      // Transform updates to match adapter interface
      const adapterUpdates = {
        ...updates,
        createdAt: updates.createdAt?.toISOString(),
        updatedAt: updates.updatedAt?.toISOString()
      };
      
      const updatedTable = await tableAdapter.updateTable(id, adapterUpdates);
      setTables(prev => prev.map(table => 
        table.id === id ? { 
          ...updatedTable, 
          createdAt: new Date(updatedTable.createdAt),
          updatedAt: updatedTable.updatedAt ? new Date(updatedTable.updatedAt) : undefined
        } : table
      ));
    } catch (error) {
      console.error('Error updating table:', error);
      
      toast({
        title: "Błąd aktualizacji stołu",
        description: "Nie udało się zaktualizować danych stołu. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const deleteTable = async (id: string) => {
    try {
      await tableAdapter.deleteTable(id);
      setTables(prev => prev.filter(table => table.id !== id));
    } catch (error) {
      console.error('Error deleting table:', error);
      
      toast({
        title: "Błąd usuwania stołu",
        description: "Nie udało się usunąć stołu. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const assignGuestToTable = async (guestId: string, tableId: string | null) => {
    try {
      console.log('🔄 TableContext: Assigning guest to table:', { guestId, tableId })
      
      if (tableId) {
        await tableAdapter.assignGuestToTable(guestId, tableId);
        console.log('✅ TableContext: Guest assigned to table via adapter')
      } else {
        await tableAdapter.removeGuestFromTable(guestId);
        console.log('✅ TableContext: Guest removed from table via adapter')
      }
      
      // Update local state immediately
      setTables(prev => prev.map(table => ({
        ...table,
        assignedGuestIds: tableId === table.id
          ? [...table.assignedGuestIds.filter(id => id !== guestId), guestId]
          : table.assignedGuestIds.filter(id => id !== guestId)
      })));
      
      console.log('✅ TableContext: Local state updated successfully')
    } catch (error) {
      console.error('❌ TableContext: Error assigning guest to table:', error);
      
      toast({
        title: "Błąd przypisywania gościa do stołu",
        description: "Nie udało się przypisać gościa do stołu. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const removeGuestFromTable = async (guestId: string) => {
    try {
      await tableAdapter.removeGuestFromTable(guestId);
      
      setTables(prev => prev.map(table => ({
        ...table,
        assignedGuestIds: table.assignedGuestIds.filter(id => id !== guestId)
      })));
    } catch (error) {
      console.error('Error removing guest from table:', error);
      
      toast({
        title: "Błąd usuwania gościa ze stołu",
        description: "Nie udało się usunąć gościa ze stołu. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const getTableById = (id: string): Table | undefined => {
    return tables.find(table => table.id === id);
  };

  const getAssignedGuestsCount = (): number => {
    return tables.reduce((total, table) => total + table.assignedGuestIds.length, 0);
  };

  const getTotalSeats = (): number => {
    return tables.reduce((total, table) => total + table.seats, 0);
  };

  const getOccupiedSeats = (): number => {
    return getAssignedGuestsCount();
  };

  const value: TableContextType = {
    tables,
    loading,
    addTable,
    updateTable,
    deleteTable,
    assignGuestToTable,
    removeGuestFromTable,
    getTableById,
    getAssignedGuestsCount,
    getTotalSeats,
    getOccupiedSeats,
  };

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
}