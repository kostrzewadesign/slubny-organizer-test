import type { Expense } from '@/context/TaskContext';

/**
 * Helper function to determine if a budget item is considered paid
 * This is the single source of truth for payment status in the application
 */
export function isPaid(expense: Expense): boolean {
  return expense.paymentStatus === 'paid';
}

/**
 * Get the appropriate CSS classes for expense styling based on payment status
 * Matches the styling from Tasks page for consistency
 */
export function getExpenseStatusClasses(expense: Expense): string {
  if (isPaid(expense)) {
    return 'bg-success/10 !shadow-none !border-0 border-transparent !ring-0 focus:!ring-0 focus-visible:!ring-0 hover:!ring-0 outline-none focus:!outline-none';
  }
  return 'bg-white shadow-card hover:shadow-card-hover border border-border/30';
}

/**
 * Get text color classes for expense items
 */
export function getExpenseTextClasses(expense: Expense): string {
  if (isPaid(expense)) {
    return 'text-primary line-through';
  }
  return 'text-[#1E1E1E]';
}

/**
 * Get the chip label for an expense based on its status
 */
export function getExpenseChipLabel(expense: Expense): string {
  if (expense.isDeposit) {
    return isPaid(expense) ? 'ZALICZKA ZAPŁACONA' : 'ZALICZKA';
  }
  return isPaid(expense) ? 'ZAPŁACONE' : 'DO ZAPŁATY';
}

/**
 * Get the chip styling for an expense
 */
export function getExpenseChipClasses(expense: Expense): string {
  if (isPaid(expense)) {
    return 'bg-success/10 text-success border-success/20';
  }
  if (expense.isDeposit && !isPaid(expense)) {
    return 'bg-warning/10 text-warning-foreground border-warning/20';
  }
  if (!expense.isDeposit && !isPaid(expense)) {
    return 'bg-destructive/10 text-destructive border-destructive/20';
  }
  return 'bg-muted text-muted-foreground border-muted';
}