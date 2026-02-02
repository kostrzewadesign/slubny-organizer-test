import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { isPaid, getExpenseStatusClasses, getExpenseTextClasses, getExpenseChipLabel, getExpenseChipClasses } from '@/lib/budget-helpers';
import type { Expense } from '@/context/TaskContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ExpenseItemProps {
  expense: Expense;
  onToggle: (expenseId: string) => void;
  formatCurrency: (amount: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

export function ExpenseItem({ expense, onToggle, formatCurrency, className, style }: ExpenseItemProps) {
  const navigate = useNavigate();
  const paidStatus = isPaid(expense);

  const combinedStyle = paidStatus ? { ...style, backgroundColor: 'hsla(73, 51%, 94%, 0.4)' } : style;

  return (
    <Card 
      id={`expense-${expense.id}`}
      className={cn(`p-4 cursor-pointer transition-all duration-200 ${getExpenseStatusClasses(expense)}`, className)}
      style={combinedStyle}
      onClick={() => navigate(`/budget/edit/${expense.id}`, { state: { scrollToId: expense.id } })}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mt-1 shrink-0 p-2 -m-2"
          >
            <Checkbox
              checked={paidStatus}
              onCheckedChange={() => onToggle(expense.id)}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`font-barlow font-medium text-base mb-1 ${getExpenseTextClasses(expense)}`}>
              {expense.title}
            </h3>
            
            <span className={`font-barlow font-normal text-sm opacity-80 ${getExpenseTextClasses(expense)}`}>
              {formatCurrency(expense.amount)}
            </span>
          </div>
        </div>
        
        <div className="shrink-0">
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-wedding uppercase h-5 min-h-5 ${getExpenseChipClasses(expense)}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isPaid(expense) ? 'bg-success' : expense.isDeposit ? 'bg-warning' : 'bg-destructive'}`} />
            <span className="hidden sm:block">{getExpenseChipLabel(expense)}</span>
            <span className="block sm:hidden">{expense.isDeposit ? (isPaid(expense) ? 'ZAL. ZAPŁACONA' : 'ZALICZKA') : (isPaid(expense) ? 'ZAPŁACONE' : 'DO ZAPŁATY')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}