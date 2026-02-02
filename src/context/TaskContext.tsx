import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { taskAdapter, budgetAdapter } from '@/lib/supabase-adapters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';
import { TaskInputSchema, ExpenseInputSchema } from '@/lib/task-validation';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  description?: string;
  isPriority: boolean;
  createdAt: Date;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  isDeposit: boolean;
  paymentStatus: 'none' | 'paid';
  note?: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface TaskContextType {
  tasks: Task[];
  budgetTasks: Task[];
  expenses: Expense[];
  customCategories: string[];
  customExpenseCategories: string[];
  uniqueExpenseCategories: string[];
  loading: boolean;
  loadingTasks: boolean;
  loadingExpenses: boolean;
  loadingBudget: boolean;
  // Budget selectors (computed values)
  totalBudget: number;
  spent: number;
  remaining: number;
  spentPct: number;
  remainingPct: number;
  // Extended budget selectors for new progress bars
  paidAmount: number;
  depositAmount: number;
  totalPaid: number;
  unpaidAmount: number;
  // Actions
  addTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => Promise<void>;
  addBudgetTask: (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'completed' | 'createdAt'>) => Promise<void>;
  addCustomCategory: (categoryName: string) => void;
  addCustomExpenseCategory: (categoryName: string) => void;
  toggleTask: (taskId: string) => Promise<void>;
  toggleBudgetTask: (taskId: string) => void;
  toggleExpense: (expenseId: string) => Promise<void>;
  editTask: (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'category' | 'isPriority'>>) => Promise<void>;
  editExpense: (expenseId: string, updates: Partial<Pick<Expense, 'title' | 'amount' | 'isDeposit' | 'paymentStatus' | 'note'>>) => Promise<void>;
  markExpenseAsPaid: (expenseId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  updateTotalBudget: (amount: number) => Promise<void>;
  editTaskCategory: (oldName: string, newName: string) => void;
  editExpenseCategory: (oldName: string, newName: string) => void;
  resetTasksToDefault: () => void;
  clearAllData: () => void;
  
  // Initialize default expenses
  initDefaultExpenses: () => Promise<boolean>;
  resetExpensesToDefault: () => Promise<boolean>;
  
  // Refresh budget from profile
  refreshBudget: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function useTask() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
}

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const { user, session, loading: authLoading, authReady, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetTasks, setBudgetTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalBudget, setTotalBudget] = useState<number>(50000);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customExpenseCategories, setCustomExpenseCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs to prevent multiple loads and track user state
  const isLoadingRef = useRef(false);
  const userLoadedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);
  const dataCache = useRef<{tasks?: Task[], expenses?: Expense[], budget?: number}>({});
  
  // Task initialization control - prevents multiple edge function calls
  const isInitializingTasksRef = useRef(false);
  const initTasksPromiseRef = useRef<Promise<void> | null>(null);
  const hasCheckedTasksInitRef = useRef(false);
  
  // Expense initialization control
  const isInitializingExpensesRef = useRef(false);
  const initExpensesPromiseRef = useRef<Promise<void> | null>(null);
  const hasCheckedExpensesInitRef = useRef(false);

  // Note: We don't need a separate auth-changed listener
  // The main useEffect below already handles user changes properly

  // Stable user reference to prevent unnecessary re-renders
  const stableUser = useMemo(() => user, [user?.id]);

  // Retry logic for database operations with auth error handling
  const retryWithAuth = useCallback(async <T,>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      // Check if it's an auth-related error
      const isAuthError =
        error?.message?.toLowerCase().includes('jwt') ||
        error?.message?.toLowerCase().includes('authentication') ||
        error?.code === 'PGRST301' || // PostgREST auth error
        error?.code === '401';

      if (isAuthError) {
        console.warn(`[TaskContext] Auth error in ${operationName}, verifying session...`);

        // Verify session is still valid
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (!currentSession || sessionError) {
          console.error('[TaskContext] Session invalid, forcing logout');
          await signOut();
          throw new Error('Sesja wygasła. Zaloguj się ponownie.');
        }

        // Session is valid, try to refresh it
        console.log('[TaskContext] Session valid, attempting refresh...');
        const { error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          console.error('[TaskContext] Token refresh failed:', refreshError);
          await signOut();
          throw new Error('Nie udało się odświeżyć sesji. Zaloguj się ponownie.');
        }

        console.log('[TaskContext] Session refreshed, retrying operation...');

        // Retry the operation once after refresh
        try {
          return await operation();
        } catch (retryError) {
          console.error(`[TaskContext] Retry failed for ${operationName}:`, retryError);
          throw retryError;
        }
      }

      // Not an auth error, throw original error
      throw error;
    }
  }, [signOut]);
  
  // Helper function with timeout and cleanup
  const withTimeout = useCallback(<T,>(promise: Promise<T>, timeoutMs: number, description: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${description} timed out after ${timeoutMs}ms`)),
          timeoutMs
        );
      })
    ]).finally(() => clearTimeout(timeoutId));
  }, []);

  const MAX_RETRIES = 2;

  // Controlled task initialization - only invokes edge function when needed
  // CRITICAL: This function can delete data, so we must verify auth is valid first!
  const ensureTasksInitialized = useCallback(async (): Promise<void> => {
    if (!stableUser) return;

    // Mutex - if already initializing, wait for existing Promise
    if (isInitializingTasksRef.current && initTasksPromiseRef.current) {
      console.log('[TaskContext] Task init already in progress, waiting...');
      return initTasksPromiseRef.current;
    }

    // Already checked for this user in this session
    if (hasCheckedTasksInitRef.current) {
      return;
    }

    isInitializingTasksRef.current = true;

    const initPromise = (async () => {
      try {
        // CRITICAL: Verify server-side auth BEFORE any potentially destructive operations
        const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !verifiedUser || verifiedUser.id !== stableUser.id) {
          console.warn('[TaskContext] ⚠️ Auth verification failed, skipping task init to prevent data loss:', {
            authError: authError?.message,
            hasVerifiedUser: !!verifiedUser,
            idMatch: verifiedUser?.id === stableUser.id
          });
          hasCheckedTasksInitRef.current = true;
          return;
        }

        // 1. Check DB marker FIRST (most reliable - prevents false positives from RLS issues)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('tasks_initialized')
          .eq('user_id', stableUser.id)
          .maybeSingle();

        if (profileError) {
          console.warn('[TaskContext] ⚠️ Cannot check tasks_initialized marker, skipping init:', profileError);
          hasCheckedTasksInitRef.current = true;
          return;
        }

        if (profile?.tasks_initialized) {
          console.log('[TaskContext] Tasks already initialized (DB marker)');
          hasCheckedTasksInitRef.current = true;
          return;
        }

        // 2. Check localStorage (fallback per-device)
        const localKey = `tasks-init-${stableUser.id}`;
        if (localStorage.getItem(localKey) === '1') {
          console.log('[TaskContext] Tasks already initialized (localStorage)');
          hasCheckedTasksInitRef.current = true;
          return;
        }

        // 3. Check if user already has tasks
        const { count, error: countError } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', stableUser.id);

        if (countError) {
          console.warn('[TaskContext] ⚠️ Failed to check task count, skipping init to be safe:', countError);
          hasCheckedTasksInitRef.current = true;
          return;
        }

        if (count && count > 0) {
          console.log('[TaskContext] User already has', count, 'tasks, skipping init');
          hasCheckedTasksInitRef.current = true;
          return;
        }

        // 4. No tasks and no markers -> invoke init (safe now that we verified auth)
        console.log('[TaskContext] No tasks found, invoking task-init-defaults...');

        const { data, error } = await supabase.functions.invoke('task-init-defaults', {
          body: {}
        });

        if (error) {
          console.error('[TaskContext] Edge function error:', error);
        } else {
          console.log('[TaskContext] Task init result:', data);

          // 5. Set markers after success
          localStorage.setItem(localKey, '1');

          await supabase
            .from('user_profiles')
            .update({ tasks_initialized: true })
            .eq('user_id', stableUser.id);
        }

        hasCheckedTasksInitRef.current = true;

      } finally {
        isInitializingTasksRef.current = false;
        initTasksPromiseRef.current = null;
      }
    })();

    initTasksPromiseRef.current = initPromise;
    return initPromise;
  }, [stableUser]);

  // Controlled expense initialization - only invokes edge function when needed
  // CRITICAL: This function can delete data, so we must verify auth is valid first!
  const ensureExpensesInitialized = useCallback(async (): Promise<void> => {
    if (!stableUser) return;

    // Mutex - if already initializing, wait for existing Promise
    if (isInitializingExpensesRef.current && initExpensesPromiseRef.current) {
      console.log('[TaskContext] Expense init already in progress, waiting...');
      return initExpensesPromiseRef.current;
    }

    // Already checked for this user in this session
    if (hasCheckedExpensesInitRef.current) {
      return;
    }

    isInitializingExpensesRef.current = true;

    const initPromise = (async () => {
      try {
        // CRITICAL: Verify server-side auth BEFORE any potentially destructive operations
        const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !verifiedUser || verifiedUser.id !== stableUser.id) {
          console.warn('[TaskContext] ⚠️ Auth verification failed, skipping expense init to prevent data loss:', {
            authError: authError?.message,
            hasVerifiedUser: !!verifiedUser,
            idMatch: verifiedUser?.id === stableUser.id
          });
          hasCheckedExpensesInitRef.current = true;
          return;
        }

        // 1. Check DB marker FIRST (most reliable - prevents false positives from RLS issues)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('expenses_initialized')
          .eq('user_id', stableUser.id)
          .maybeSingle();

        if (profileError) {
          console.warn('[TaskContext] ⚠️ Cannot check expenses_initialized marker, skipping init:', profileError);
          hasCheckedExpensesInitRef.current = true;
          return;
        }

        if (profile?.expenses_initialized) {
          console.log('[TaskContext] Expenses already initialized (DB marker)');
          hasCheckedExpensesInitRef.current = true;
          return;
        }

        // 2. Check localStorage (fallback per-device)
        const localKey = `expenses-init-${stableUser.id}`;
        if (localStorage.getItem(localKey) === '1') {
          console.log('[TaskContext] Expenses already initialized (localStorage)');
          hasCheckedExpensesInitRef.current = true;
          return;
        }

        // 3. Check if user already has expenses
        const { count, error: countError } = await supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', stableUser.id);

        if (countError) {
          console.warn('[TaskContext] ⚠️ Failed to check expense count, skipping init to be safe:', countError);
          hasCheckedExpensesInitRef.current = true;
          return;
        }

        if (count && count > 0) {
          console.log('[TaskContext] User already has', count, 'expenses, skipping init');
          hasCheckedExpensesInitRef.current = true;
          return;
        }

        // 4. No expenses and no markers -> invoke init (safe now that we verified auth)
        console.log('[TaskContext] No expenses found, invoking budget-init-defaults...');

        const { data, error } = await supabase.functions.invoke('budget-init-defaults', {
          body: {}
        });

        if (error) {
          console.error('[TaskContext] Expense init edge function error:', error);
        } else {
          console.log('[TaskContext] Expense init result:', data);

          // 5. Set markers after success
          localStorage.setItem(localKey, '1');

          await supabase
            .from('user_profiles')
            .update({ expenses_initialized: true })
            .eq('user_id', stableUser.id);
        }

        hasCheckedExpensesInitRef.current = true;
        
      } finally {
        isInitializingExpensesRef.current = false;
        initExpensesPromiseRef.current = null;
      }
    })();
    
    initExpensesPromiseRef.current = initPromise;
    return initPromise;
  }, [stableUser]);

  // Load individual data parts with caching
  const loadTasksData = useCallback(async (): Promise<Task[] | undefined> => {
    if (!stableUser || loadingTasks) return;

    // Check cache first
    if (dataCache.current.tasks &&
        dataCache.current.tasks.length > 0 &&
        currentUserIdRef.current === stableUser.id) {
      console.log('Using cached tasks data');
      return dataCache.current.tasks;
    }

    setLoadingTasks(true);
    try {
      console.log('Loading tasks data...');

      // Controlled init - only invokes edge function when truly needed
      await ensureTasksInitialized();

      const loadedTasks = await retryWithAuth(
        () => withTimeout(
          taskAdapter.getTasks(),
          15000,
          'Tasks loading'
        ),
        'loadTasksData'
      );

      const tasksWithDates = loadedTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt)
      }));

      // Cache the data
      dataCache.current = { ...dataCache.current, tasks: tasksWithDates };
      return tasksWithDates;
    } catch (error) {
      console.error('[TaskContext] ❌ Error loading tasks:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        userId: stableUser?.id
      });
      throw error;
    } finally {
      setLoadingTasks(false);
    }
  }, [stableUser, withTimeout, ensureTasksInitialized, retryWithAuth]);

  const loadExpensesData = useCallback(async (): Promise<Expense[] | undefined> => {
    if (!stableUser || loadingExpenses) return;

    // Check cache first
    if (dataCache.current.expenses &&
        dataCache.current.expenses.length > 0 &&
        currentUserIdRef.current === stableUser.id) {
      console.log('Using cached expenses data');
      return dataCache.current.expenses;
    }

    setLoadingExpenses(true);
    try {
      console.log('Loading expenses data...');

      // Controlled init - only invokes edge function when truly needed
      await ensureExpensesInitialized();

      // Session is already ready (authReady === true), no need to wait

      let loadedExpenses = await retryWithAuth(
        () => withTimeout(
          budgetAdapter.getExpenses(),
          15000,
          'Expenses loading'
        ),
        'loadExpensesData'
      );

      // DISABLED: Fallback template loading removed - it was causing data deletion!
      // The ensureExpensesInitialized() function above handles initialization safely.
      // If loadedExpenses is empty after proper init, user genuinely has no expenses.
      if (loadedExpenses.length === 0) {
        console.log('[TaskContext] No expenses found after initialization - this is normal for users who deleted all expenses');
        // Do NOT call loadExpenseTemplatesInternal() - it deletes existing data!
        // The user can manually load templates via the Budget page "Załaduj domyślne wydatki" button
      }

      /* REMOVED - Dangerous fallback that was deleting user data:
      if (loadedExpenses.length === 0) {
        const userTemplateKey = `budget-template-loaded-${stableUser.id}`;
        const hasLoadedTemplates = localStorage.getItem(userTemplateKey);
        if (!hasLoadedTemplates) {
          await loadExpenseTemplatesInternal();  // THIS DELETES ALL EXPENSES!
        }
      }
      */

      const expensesWithDates = loadedExpenses.map(expense => ({
        ...expense,
        createdAt: new Date(expense.createdAt)
      }));

      // Cache the data
      dataCache.current = { ...dataCache.current, expenses: expensesWithDates };
      return expensesWithDates;
    } catch (error) {
      console.error('[TaskContext] ❌ Error loading expenses:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        userId: stableUser?.id
      });
      throw error;
    } finally {
      setLoadingExpenses(false);
    }
  }, [stableUser, withTimeout, ensureExpensesInitialized, retryWithAuth]);

  const loadBudgetData = useCallback(async (): Promise<number | undefined> => {
    if (!stableUser || loadingBudget) return;

    // Check cache first
    if (dataCache.current.budget !== undefined && currentUserIdRef.current === stableUser.id) {
      console.log('Using cached budget data');
      return dataCache.current.budget;
    }

    setLoadingBudget(true);
    try {
      console.log('Loading budget data...');
      const loadedBudget = await retryWithAuth(
        () => withTimeout(
          budgetAdapter.getTotalBudget(),
          20000,
          'Budget loading'
        ),
        'loadBudgetData'
      );

      // Cache the data
      dataCache.current = { ...dataCache.current, budget: loadedBudget };
      return loadedBudget;
    } finally {
      setLoadingBudget(false);
    }
  }, [stableUser, withTimeout, retryWithAuth]);

  // Load budget from user_profiles (for setup data sync)
  const loadBudgetFromProfile = useCallback(async (): Promise<number | null> => {
    if (!stableUser) return null;
    
    try {
      console.log('Loading budget from user profile...');
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('total_budget')
        .eq('user_id', stableUser.id)
        .single();
      
      if (error) {
        console.warn('Failed to load budget from profile:', error);
        return null;
      }
      
      if (profile?.total_budget !== null && profile?.total_budget !== undefined) {
        console.log('Budget loaded from profile:', profile.total_budget);
        setTotalBudget(profile.total_budget);
        dataCache.current = { ...dataCache.current, budget: profile.total_budget };
        return profile.total_budget;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading budget from profile:', error);
      return null;
    }
  }, [stableUser]);

  // Internal function for loading expense templates
  // WARNING: This function DELETES ALL EXPENSES before loading templates!
  // Only use when user explicitly requests it (e.g., "Załaduj domyślne wydatki" button)
  const loadExpenseTemplatesInternal = async () => {
    if (!user) return;

    // CRITICAL: Verify server-side auth before deleting data
    const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !verifiedUser || verifiedUser.id !== user.id) {
      console.error('[TaskContext] ❌ Auth verification failed, refusing to delete expenses:', {
        authError: authError?.message,
        hasVerifiedUser: !!verifiedUser,
        idMatch: verifiedUser?.id === user.id
      });
      throw new Error('Weryfikacja autoryzacji nie powiodła się. Zaloguj się ponownie.');
    }

    console.log('[TaskContext] ⚠️ loadExpenseTemplatesInternal called - this will DELETE all expenses!');

    try {
      // Clear all existing expenses
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Get expense templates from database
      const { data: templates, error: templatesError } = await supabase
        .from('wedding_templates')
        .select('*')
        .eq('template_type', 'expense')
        .order('order_index');

      if (templatesError) throw templatesError;

      // Create expenses from templates with 0 amounts
      if (templates && templates.length > 0) {
        const expensesToInsert = templates.map(template => ({
          user_id: user.id,
          title: template.title,
          category: template.category,
          amount: 0, // Start with 0 amounts as templates
          payment_status: (template.payment_status as 'none' | 'paid' | 'deposit_paid' | 'deposit_only') || 'none'
        }));

        const { error: insertError } = await supabase
          .from('expenses')
          .insert(expensesToInsert);

        if (insertError) throw insertError;
      }

      console.log('[TaskContext] ✅ Expense templates loaded successfully');
    } catch (error) {
      console.error('Error loading expense templates:', error);
      throw error;
    }
  };

  // Main data loading effect with improved stability
  useEffect(() => {
    console.log('[TaskContext] Effect triggered:', { 
      authReady,
      userId: stableUser?.id, 
      isLoading: isLoadingRef.current,
      userLoaded: userLoadedRef.current,
      currentUserId: currentUserIdRef.current
    });
    
    // Wait for auth to be resolved
    if (!authReady) {
      console.log('[TaskContext] Auth not ready, waiting...');
      return;
    }
    
    // No user or session - clear data
    if (!stableUser || !session) {
      console.log('[TaskContext] No user or session - clearing data');
      if (userLoadedRef.current) {
        setTasks([]);
        setBudgetTasks([]);
        setExpenses([]);
        setTotalBudget(50000);
        setCustomCategories([]);
        setCustomExpenseCategories([]);
        dataCache.current = {};
        userLoadedRef.current = false;
        currentUserIdRef.current = null;
      }
      setLoading(false);
      return;
    }
    
    // Check if user changed
    const userChanged = currentUserIdRef.current !== stableUser.id;
    if (userChanged) {
      console.log('User changed, clearing cache and init markers');
      dataCache.current = {};
      currentUserIdRef.current = stableUser.id;
      userLoadedRef.current = false;
      
      // Reset init check markers for new user
      hasCheckedTasksInitRef.current = false;
      hasCheckedExpensesInitRef.current = false;
    }
    
    // Prevent multiple concurrent loads
    if (isLoadingRef.current) {
      console.log('Already loading, skipping duplicate load');
      return;
    }
    
    // Always load data if user exists and cache is empty
    if (userLoadedRef.current && !userChanged && !retryCount && dataCache.current.tasks && dataCache.current.expenses) {
      console.log('User data already loaded and cached, skipping');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      const startTime = Date.now();
      isLoadingRef.current = true;
      setLoading(true);
      
      try {
        console.log(`[TaskContext] ${new Date().toISOString()} - Starting progressive data load for user: ${stableUser.id}`);
        
      // Load data progressively with individual timeouts
      const loadPromises = [
        loadTasksData(),
        loadExpensesData(),
        loadBudgetData()
      ];
      
      // Use Promise.allSettled instead of Promise.all
      const [tasksRes, expensesRes, budgetRes] = await Promise.allSettled(loadPromises);
      
      // Track failures for user notification
      const failures: string[] = [];
      
      // Tasks
      if (tasksRes.status === 'fulfilled' && tasksRes.value) {
        const weddingTasks = (tasksRes.value as Task[]).filter((task: any) => task.taskType === 'wedding');
        const budgetTasksData = (tasksRes.value as Task[]).filter((task: any) => task.taskType === 'budget');
        setTasks(weddingTasks as Task[]);
        setBudgetTasks(budgetTasksData as Task[]);
      } else if (tasksRes.status === 'rejected') {
        console.error('[TaskContext] Tasks loading failed:', tasksRes.reason);
        failures.push('zadania');
      }
      
      // Expenses
      if (expensesRes.status === 'fulfilled' && expensesRes.value) {
        setExpenses(expensesRes.value as Expense[]);
      } else if (expensesRes.status === 'rejected') {
        console.error('[TaskContext] Expenses loading failed:', expensesRes.reason);
        failures.push('wydatki');
      }
      
      // Budget - ALWAYS prioritize user_profiles.total_budget
      const profileBudget = await loadBudgetFromProfile();
      
      // Fallback to budgetAdapter ONLY if profile didn't have budget at all
      if (profileBudget === null) {
        console.log('[TaskContext] No budget in profile, checking adapter...');
        
        if (budgetRes.status === 'fulfilled' && budgetRes.value !== undefined) {
          console.log('[TaskContext] Using budget from adapter:', budgetRes.value);
          setTotalBudget(budgetRes.value as number);
          dataCache.current = { ...dataCache.current, budget: budgetRes.value as number };
        } else {
          console.warn('[TaskContext] Budget loading failed, using default 50000');
          failures.push('budżet');
          setTotalBudget(50000);
          dataCache.current = { ...dataCache.current, budget: 50000 };
        }
      } else {
        console.log('[TaskContext] Using budget from profile:', profileBudget);
      }
      
      // Show toast if any data failed to load
      if (failures.length > 0) {
        toast({
          title: "Błąd wczytywania danych",
          description: `Nie udało się wczytać: ${failures.join(', ')}. Sprawdź połączenie internetowe i odśwież stronę.`,
          variant: "destructive",
          duration: 6000
        });
      }
        
        // Load custom categories from localStorage
        const userCategoriesKey = `custom-categories-${stableUser.id}`;
        const userExpenseCategoriesKey = `custom-expense-categories-${stableUser.id}`;
        const savedCategories = localStorage.getItem(userCategoriesKey);
        const savedExpenseCategories = localStorage.getItem(userExpenseCategoriesKey);
        
        if (savedCategories) {
          setCustomCategories(JSON.parse(savedCategories));
        }
        if (savedExpenseCategories) {
          setCustomExpenseCategories(JSON.parse(savedExpenseCategories));
        }
        
        userLoadedRef.current = true;
        setRetryCount(0);
        const loadTime = Date.now() - startTime;
        console.log(`[TaskContext] ${new Date().toISOString()} - Data loading completed in ${loadTime}ms`);
        
      } catch (error) {
        console.error(`[TaskContext] ${new Date().toISOString()} - Critical error loading data:`, error);
        
        toast({
          title: "Błąd ładowania danych",
          description: "Wystąpił problem z wczytaniem danych. Sprawdź połączenie internetowe i spróbuj odświeżyć stronę.",
          variant: "destructive",
          duration: 8000
        });
        
        userLoadedRef.current = true;
        setRetryCount(0);
      } finally {
        isLoadingRef.current = false;
        setLoading(false);
      }
    };

    loadData();
  }, [authReady, stableUser?.id, session, retryCount, loadTasksData, loadExpensesData, loadBudgetData, loadBudgetFromProfile]);

  const addTask = async (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      console.log('TaskContext: Adding new task...', task);
      
      // Validate input with zod schema
      const validation = TaskInputSchema.safeParse(task);
      
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        console.error('[TaskContext] Validation failed:', validation.error);
        throw new Error(`Błąd walidacji: ${errorMessages}`);
      }
      
      // Type assertion: zod validates required fields
      const validatedData = validation.data as { title: string; category: string; description?: string; isPriority: boolean };
      
      const taskData = {
        ...validatedData,
        taskType: 'wedding' as const,
        completed: false
      };
      const newTask = await taskAdapter.addTask(taskData);
      const taskWithDate = { ...newTask, createdAt: new Date(newTask.createdAt) };
      setTasks(prev => [...prev, taskWithDate]);
      
      // Update cache
      if (dataCache.current.tasks) {
        dataCache.current.tasks = [...dataCache.current.tasks, taskWithDate];
      }
      
      console.log('TaskContext: Task added successfully');
    } catch (error) {
      console.error('TaskContext: Error adding task:', error);
      throw error;
    }
  };

  const addBudgetTask = (task: Omit<Task, 'id' | 'completed' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date()
    };
    setBudgetTasks(prev => [...prev, newTask]);
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'completed' | 'createdAt'>) => {
    if (!user) return;
    
    try {
      console.log('TaskContext: Adding new expense...', expense);
      
      // Validate input with zod schema
      const validation = ExpenseInputSchema.safeParse(expense);
      
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        console.error('[TaskContext] Validation failed:', validation.error);
        throw new Error(`Błąd walidacji: ${errorMessages}`);
      }
      
      // Type assertion: zod validates required fields
      const validatedData = validation.data as { 
        title: string; 
        category: string; 
        amount: number; 
        isDeposit: boolean; 
        paymentStatus: 'none' | 'paid';
        note?: string;
      };
      
      const expenseData = {
        ...validatedData,
        completed: false
      };
      const newExpense = await budgetAdapter.addExpense(expenseData);
      const expenseWithDate = { ...newExpense, createdAt: new Date(newExpense.createdAt) };
      setExpenses(prev => [...prev, expenseWithDate]);
      
      // Update cache
      if (dataCache.current.expenses) {
        dataCache.current.expenses = [...dataCache.current.expenses, expenseWithDate];
      }
      
      console.log('TaskContext: Expense added successfully');
    } catch (error) {
      console.error('TaskContext: Error adding expense:', error);
      throw error;
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const updatedTask = await taskAdapter.updateTask(taskId, { completed: !task.completed });
      const taskWithDate = { ...updatedTask, createdAt: new Date(updatedTask.createdAt) };
      setTasks(prev => prev.map(t => t.id === taskId ? taskWithDate : t));
      
      // Update cache
      if (dataCache.current.tasks) {
        dataCache.current.tasks = dataCache.current.tasks.map(t => t.id === taskId ? taskWithDate : t);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const toggleBudgetTask = (taskId: string) => {
    setBudgetTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Helper functions for simplified payment logic
  const effectivePaid = (expense: Expense): number => {
    return expense.paymentStatus === 'paid' ? expense.amount : 0;
  };

  const depositPortion = (expense: Expense): number => {
    return expense.isDeposit && expense.paymentStatus === 'paid' ? expense.amount : 0;
  };

  const toggleExpense = async (expenseId: string) => {
    if (!user) return;
    
    try {
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) return;
      
      const newPaymentStatus: 'none' | 'paid' = expense.paymentStatus === 'none' ? 'paid' : 'none';
      
      // Walidacja: nie pozwól oznaczyć jako "paid" jeśli kwota <= 0
      if (newPaymentStatus === 'paid' && expense.amount <= 0) {
        throw new Error('VALIDATION_AMOUNT_REQUIRED');
      }
      
      const updatedExpense = await budgetAdapter.updateExpense(expenseId, { 
        paymentStatus: newPaymentStatus 
      });
      const expenseWithDate = { ...updatedExpense, createdAt: new Date(updatedExpense.createdAt) };
      setExpenses(prev => prev.map(e => e.id === expenseId ? expenseWithDate : e));
      
      // Update cache
      if (dataCache.current.expenses) {
        dataCache.current.expenses = dataCache.current.expenses.map(e => e.id === expenseId ? expenseWithDate : e);
      }
    } catch (error) {
      console.error('Error toggling expense:', error);
      throw error;
    }
  };

  const editTask = async (taskId: string, updates: Partial<Pick<Task, 'title' | 'description' | 'category' | 'isPriority'>>) => {
    if (!user) return;
    
    try {
      const updatedTask = await taskAdapter.updateTask(taskId, updates);
      const taskWithDate = { ...updatedTask, createdAt: new Date(updatedTask.createdAt) };
      setTasks(prev => prev.map(t => t.id === taskId ? taskWithDate : t));
      
      // Update cache
      if (dataCache.current.tasks) {
        dataCache.current.tasks = dataCache.current.tasks.map(t => t.id === taskId ? taskWithDate : t);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const editExpense = async (expenseId: string, updates: Partial<Pick<Expense, 'title' | 'amount' | 'isDeposit' | 'paymentStatus' | 'note'>>) => {
    if (!user) return;
    
    try {
      // Validate updates with zod schema (partial)
      const validation = ExpenseInputSchema.partial().safeParse(updates);
      
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        console.error('[TaskContext] Validation failed:', validation.error);
        throw new Error(`Błąd walidacji: ${errorMessages}`);
      }
      
      const updatedExpense = await budgetAdapter.updateExpense(expenseId, validation.data);
      const expenseWithDate = { ...updatedExpense, createdAt: new Date(updatedExpense.createdAt) };
      setExpenses(prev => prev.map(e => e.id === expenseId ? expenseWithDate : e));
      
      // Update cache
      if (dataCache.current.expenses) {
        dataCache.current.expenses = dataCache.current.expenses.map(e => e.id === expenseId ? expenseWithDate : e);
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const markExpenseAsPaid = async (expenseId: string) => {
    if (!user) return;
    
    try {
      const updatedExpense = await budgetAdapter.updateExpense(expenseId, { 
        paymentStatus: 'paid'
      });
      const expenseWithDate = { ...updatedExpense, createdAt: new Date(updatedExpense.createdAt) };
      setExpenses(prev => prev.map(e => e.id === expenseId ? expenseWithDate : e));
      
      // Update cache
      if (dataCache.current.expenses) {
        dataCache.current.expenses = dataCache.current.expenses.map(e => e.id === expenseId ? expenseWithDate : e);
      }
    } catch (error) {
      console.error('Error marking expense as paid:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    
    try {
      await taskAdapter.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
      // Update cache
      if (dataCache.current.tasks) {
        dataCache.current.tasks = dataCache.current.tasks.filter(t => t.id !== taskId);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    
    try {
      await budgetAdapter.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      
      // Update cache
      if (dataCache.current.expenses) {
        dataCache.current.expenses = dataCache.current.expenses.filter(e => e.id !== expenseId);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const updateTotalBudget = useCallback(async (amount: number) => {
    if (!user) return;
    
    // Idempotency guard - prevent unnecessary updates
    if (totalBudget === amount) {
      console.log('[TaskContext] Total budget unchanged, skipping update');
      return;
    }
    
    try {
      console.log(`[TaskContext] ${new Date().toISOString()} - Updating total budget: ${totalBudget} → ${amount}`);
      
      // Update in budget adapter (expenses table context)
      await budgetAdapter.setTotalBudget(amount);
      
      // Also update in user_profiles table
      await supabase
        .from('user_profiles')
        .update({ total_budget: amount })
        .eq('user_id', user.id);
      
      setTotalBudget(amount);
      
      // Update cache
      dataCache.current = { ...dataCache.current, budget: amount };
      
      console.log('Budget updated in both expenses and user_profiles:', amount);
    } catch (error) {
      console.error('[TaskContext] Error updating total budget:', error);
    }
  }, [user, totalBudget]);

  const addCustomCategory = (categoryName: string) => {
    if (!user) return;
    setCustomCategories(prev => {
      const newCategories = [...prev, categoryName];
      const userCategoriesKey = `custom-categories-${user.id}`;
      localStorage.setItem(userCategoriesKey, JSON.stringify(newCategories));
      return newCategories;
    });
  };

  const addCustomExpenseCategory = (categoryName: string) => {
    if (!user) return;
    setCustomExpenseCategories(prev => {
      const newCategories = [...prev, categoryName];
      const userExpenseCategoriesKey = `custom-expense-categories-${user.id}`;
      localStorage.setItem(userExpenseCategoriesKey, JSON.stringify(newCategories));
      return newCategories;
    });
  };

  const editTaskCategory = (oldName: string, newName: string) => {
    // Update tasks with the old category name
    setTasks(prev => prev.map(task => 
      task.category === oldName ? { ...task, category: newName } : task
    ));
    setBudgetTasks(prev => prev.map(task => 
      task.category === oldName ? { ...task, category: newName } : task
    ));
    
    // Update custom categories
    if (user) {
      setCustomCategories(prev => {
        const newCategories = prev.map(cat => cat === oldName ? newName : cat);
        const userCategoriesKey = `custom-categories-${user.id}`;
        localStorage.setItem(userCategoriesKey, JSON.stringify(newCategories));
        return newCategories;
      });
    }
  };

  const editExpenseCategory = (oldName: string, newName: string) => {
    // Update expenses with the old category name
    setExpenses(prev => prev.map(expense => 
      expense.category === oldName ? { ...expense, category: newName } : expense
    ));
    
    // Update custom expense categories
    if (user) {
      setCustomExpenseCategories(prev => {
        const newCategories = prev.map(cat => cat === oldName ? newName : cat);
        const userExpenseCategoriesKey = `custom-expense-categories-${user.id}`;
        localStorage.setItem(userExpenseCategoriesKey, JSON.stringify(newCategories));
        return newCategories;
      });
    }
  };

  const resetTasksToDefault = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Clear all existing tasks
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) throw deleteError;
      
      // Get task templates from database
      const { data: templates, error: templatesError } = await supabase
        .from('wedding_templates')
        .select('*')
        .eq('template_type', 'task')
        .order('order_index');
      
      if (templatesError) throw templatesError;
      
      // Create tasks from templates
      if (templates && templates.length > 0) {
        const tasksToInsert = templates.map(template => ({
          user_id: user.id,
          title: template.title,
          description: template.description || '',
          category: template.category,
          is_priority: template.is_priority || false,
          completed: false
        }));
        
        const { error: insertError } = await supabase
          .from('tasks')
          .insert(tasksToInsert);
        
        if (insertError) throw insertError;
      }
      
      // Refresh tasks data
      const refreshedTasks = await taskAdapter.getTasks();
      const tasksWithDates = refreshedTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt)
      }));
      setTasks(tasksWithDates.filter(task => task.taskType !== 'budget'));
      setBudgetTasks(tasksWithDates.filter(task => task.taskType === 'budget'));
      
      // Update cache
      dataCache.current = { ...dataCache.current, tasks: tasksWithDates };
    } catch (error) {
      console.error('Error resetting tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize default expenses function
  const initDefaultExpenses = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data } = await supabase.functions.invoke('budget-init-defaults');
      // Always refetch after init to ensure UI is updated
      await loadExpensesData();
      
      if (data?.success && (data?.inserted ?? 0) > 0) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing default expenses:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zainicjalizować domyślnych wydatków.",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, loadExpensesData, toast]);

  // Reset expenses to defaults function (updated version)
  const resetExpensesToDefault = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const { data } = await supabase.functions.invoke('budget-reset-defaults');
      await loadExpensesData();
      return true;
    } catch (error) {
      console.error('Error resetting expenses to defaults:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się przywrócić domyślnych wydatków.",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, loadExpensesData]);

  // Refresh budget from profile after setup changes
  const refreshBudget = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    
    console.log('[TaskContext] Refreshing budget from profile...');
    
    // Clear budget cache to force reload
    dataCache.current = { ...dataCache.current, budget: undefined };
    
    // Reload budget from profile
    await loadBudgetFromProfile();
    
    console.log('[TaskContext] Budget refreshed successfully');
  }, [user?.id, loadBudgetFromProfile]);

  const clearAllData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('[TaskContext] Clearing task data');
      
      // Clear localStorage
      const userTasksKey = `tasks-${user.id}`;
      const userExpensesKey = `expenses-${user.id}`;
      const userBudgetKey = `total-budget-${user.id}`;
      const userCategoriesKey = `custom-categories-${user.id}`;
      const userExpenseCategoriesKey = `custom-expense-categories-${user.id}`;
      
      localStorage.removeItem(userTasksKey);
      localStorage.removeItem(userExpensesKey); 
      localStorage.removeItem(userBudgetKey);
      localStorage.removeItem(userCategoriesKey);
      localStorage.removeItem(userExpenseCategoriesKey);
      
      // Clear context state
      setTasks([]);
      setBudgetTasks([]);
      setExpenses([]);
      setTotalBudget(50000);
      setCustomCategories([]);
      setCustomExpenseCategories([]);
      setLoading(true);
      
      // Clear cache
      dataCache.current = {};
      userLoadedRef.current = false;
      
      console.log('[TaskContext] Task data cleared successfully');
    } catch (error) {
      console.error('[TaskContext] Error clearing task data:', error);
      throw error; // Re-throw to handle in Settings
    }
  }, [user]);

  // Budget calculations - memoized for performance
  const spent = useMemo(() => expenses.reduce((sum, expense) => {
    return sum + effectivePaid(expense);
  }, 0), [expenses]);

  const remaining = useMemo(() => totalBudget - spent, [totalBudget, spent]);
  const spentPct = useMemo(() => totalBudget > 0 ? (spent / totalBudget) * 100 : 0, [spent, totalBudget]);
  const remainingPct = useMemo(() => totalBudget > 0 ? (remaining / totalBudget) * 100 : 0, [remaining, totalBudget]);

  const paidAmount = useMemo(() => expenses.reduce((sum, expense) => {
    return sum + (expense.paymentStatus === 'paid' ? expense.amount : 0);
  }, 0), [expenses]);

  const depositAmount = useMemo(() => expenses.reduce((sum, expense) => {
    return sum + depositPortion(expense);
  }, 0), [expenses]);

  const totalPaid = paidAmount;
  const unpaidAmount = useMemo(() => expenses.reduce((sum, expense) => {
    return sum + (expense.paymentStatus === 'none' ? expense.amount : 0);
  }, 0), [expenses]);

  // Unique expense categories - extracted from existing expenses
  const uniqueExpenseCategories = useMemo(() => {
    const categories = expenses.map(e => e.category);
    return Array.from(new Set(categories)).sort();
  }, [expenses]);

  const value = useMemo(() => ({
    tasks,
    budgetTasks,
    expenses,
    customCategories,
    customExpenseCategories,
    uniqueExpenseCategories,
    loading,
    loadingTasks,
    loadingExpenses,
    loadingBudget,
    totalBudget,
    spent,
    remaining,
    spentPct,
    remainingPct,
    paidAmount,
    depositAmount,
    totalPaid,
    unpaidAmount,
    addTask,
    addBudgetTask,
    addExpense,
    addCustomCategory,
    addCustomExpenseCategory,
    toggleTask,
    toggleBudgetTask,
    toggleExpense,
    editTask,
    editExpense,
    markExpenseAsPaid,
    deleteTask,
    deleteExpense,
    updateTotalBudget,
    editTaskCategory,
    editExpenseCategory,
    resetTasksToDefault,
    resetExpensesToDefault,
    clearAllData,
    initDefaultExpenses,
    refreshBudget
  }), [
    tasks, budgetTasks, expenses, customCategories, customExpenseCategories, uniqueExpenseCategories,
    loading, loadingTasks, loadingExpenses, loadingBudget,
    totalBudget, spent, remaining, spentPct, remainingPct, paidAmount, depositAmount,
    totalPaid, unpaidAmount, addTask, addBudgetTask, addExpense, addCustomCategory,
    addCustomExpenseCategory, toggleTask, toggleBudgetTask, toggleExpense, editTask,
    editExpense, markExpenseAsPaid, deleteTask, deleteExpense, updateTotalBudget,
    editTaskCategory, editExpenseCategory, resetTasksToDefault, resetExpensesToDefault, 
    clearAllData, initDefaultExpenses, refreshBudget
  ]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};