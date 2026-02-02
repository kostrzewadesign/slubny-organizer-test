import { Expense } from '@/context/TaskContext';

// Data adapter interface for budget operations - ready for Supabase
export interface BudgetAdapter {
  getTotalBudget(): Promise<number>;
  setTotalBudget(amount: number): Promise<void>;
  getExpenses(): Promise<Expense[]>;
  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
}

// LocalStorage implementation (current)
export class LocalStorageAdapter implements BudgetAdapter {
  private readonly TOTAL_BUDGET_KEY = 'wedding-total-budget';
  private readonly EXPENSES_KEY = 'wedding-expenses';

  async getTotalBudget(): Promise<number> {
    const stored = localStorage.getItem(this.TOTAL_BUDGET_KEY);
    return stored ? parseFloat(stored) : 50000; // Default 50k PLN
  }

  async setTotalBudget(amount: number): Promise<void> {
    localStorage.setItem(this.TOTAL_BUDGET_KEY, amount.toString());
  }

  async getExpenses(): Promise<Expense[]> {
    const stored = localStorage.getItem(this.EXPENSES_KEY);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((expense: any) => ({
        ...expense,
        createdAt: new Date(expense.createdAt)
      }));
    } catch {
      return [];
    }
  }

  async addExpense(expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const newExpense: Expense = {
      ...expenseData,
      id: `e${Date.now()}`,
      createdAt: new Date()
    };
    
    const expenses = await this.getExpenses();
    expenses.push(newExpense);
    localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(expenses));
    
    return newExpense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const expenses = await this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    expenses[index] = { ...expenses[index], ...updates };
    localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(expenses));
    
    return expenses[index];
  }

  async deleteExpense(id: string): Promise<void> {
    const expenses = await this.getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(filtered));
  }
}

// Supabase adapter placeholder (future implementation)
export class SupabaseAdapter implements BudgetAdapter {
  async getTotalBudget(): Promise<number> {
    // TODO: Implement Supabase query
    throw new Error('Supabase adapter not implemented yet');
  }

  async setTotalBudget(amount: number): Promise<void> {
    // TODO: Implement Supabase mutation
    throw new Error('Supabase adapter not implemented yet');
  }

  async getExpenses(): Promise<Expense[]> {
    // TODO: Implement Supabase query
    throw new Error('Supabase adapter not implemented yet');
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    // TODO: Implement Supabase mutation
    throw new Error('Supabase adapter not implemented yet');
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    // TODO: Implement Supabase mutation
    throw new Error('Supabase adapter not implemented yet');
  }

  async deleteExpense(id: string): Promise<void> {
    // TODO: Implement Supabase mutation
    throw new Error('Supabase adapter not implemented yet');
  }
}

// Export current adapter instance
// Import from the new file to avoid circular dependency
import { budgetAdapter } from './supabase-adapters';
export { budgetAdapter };