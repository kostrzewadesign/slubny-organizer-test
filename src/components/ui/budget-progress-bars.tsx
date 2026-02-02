import React from 'react';
import { cn } from '@/lib/utils';

interface BudgetProgressBarsProps {
  totalBudget: number;
  spent: number;
  remaining: number;
  spentPct: number;
  remainingPct: number;
  paidAmount: number;
  depositAmount: number;
  onSegmentClick?: (filter: 'all' | 'paid' | 'deposits' | 'unpaid' | 'remaining') => void;
  activeFilter?: string;
}

// Currency formatting utility
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function BudgetProgressBars({
  totalBudget,
  spent,
  remaining,
  spentPct,
  remainingPct,
  paidAmount,
  depositAmount,
  onSegmentClick,
  activeFilter = 'all'
}: BudgetProgressBarsProps) {
  // Safeguard against invalid calculations
  const safeSpentPct = !isNaN(spentPct) && isFinite(spentPct) ? spentPct : 0;
  const safeRemainingPct = !isNaN(remainingPct) && isFinite(remainingPct) ? remainingPct : 0;
  
  const spentPercentage = Math.round(safeSpentPct * 100);
  const remainingPercentage = Math.round(safeRemainingPct * 100);
  const isLowBudget = remainingPercentage < 10 && remainingPercentage >= 0;
  const isOverBudget = spentPercentage > 100;
  const overAmount = spent - totalBudget;

  // Calculate percentages for second bar (relative to total budget) with safeguards
  const paidPct = totalBudget > 0 ? (paidAmount / totalBudget) * 100 : 0;
  const depositPct = totalBudget > 0 ? (depositAmount / totalBudget) * 100 : 0;
  const safePaidPct = !isNaN(paidPct) && isFinite(paidPct) ? paidPct : 0;
  const safeDepositPct = !isNaN(depositPct) && isFinite(depositPct) ? depositPct : 0;
  const paidPercentage = Math.round(safePaidPct);
  const depositPercentage = Math.round(safeDepositPct);

  // Check if segments are too small to show percentage inside
  const shouldShowSpentPct = spentPercentage >= 10;
  const shouldShowRemainingPct = remainingPercentage >= 10;
  const shouldShowPaidPct = paidPercentage >= 10;
  const shouldShowDepositPct = depositPercentage >= 10;

  return (
    <div className="space-y-4">
      {/* Warning messages */}
      {isLowBudget && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <p className="text-sm font-barlow text-warning-foreground font-medium">
            Zostało mniej niż 10% budżetu
          </p>
        </div>
      )}
      
      {isOverBudget && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm font-barlow text-destructive-foreground font-medium">
            Przekroczono budżet o {formatCurrency(overAmount).replace(/\s/g, '\u00A0')}
          </p>
        </div>
      )}

      {/* First Progress Bar: Wydane vs Pozostało */}
      <div className="space-y-2">
        <div className="relative">
          <div className="w-full bg-primary-light rounded-full overflow-hidden h-6">
            {/* Spent portion */}
            <div
              className={cn(
                'h-full transition-all duration-300 ease-out flex items-center justify-start pl-2 cursor-pointer',
                isOverBudget ? 'bg-destructive' : 'bg-primary',
                activeFilter === 'spent' && 'ring-2 ring-ring ring-offset-1'
              )}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              onClick={() => onSegmentClick?.('all')}
              role="button"
              tabIndex={0}
              aria-label={`Wydane ${spentPercentage}%, kliknij aby filtrować`}
            >
              {shouldShowSpentPct && (
                <span className="text-xs font-semibold text-white">
                  {spentPercentage}%
                </span>
              )}
            </div>
            
            {/* Remaining portion */}
            {!isOverBudget && remainingPercentage > 0 && (
              <div 
                className={cn(
                  'absolute top-0 right-0 h-full flex items-center justify-end pr-2 cursor-pointer transition-all duration-200',
                  isLowBudget ? 'bg-warning/20' : 'bg-primary-light',
                  activeFilter === 'remaining' && 'ring-2 ring-ring ring-offset-1'
                )}
                style={{ width: `${remainingPercentage}%` }}
                onClick={() => onSegmentClick?.('remaining')}
                role="button"
                tabIndex={0}
                aria-label={`Pozostało ${remainingPercentage}%, kliknij aby filtrować`}
              >
                {shouldShowRemainingPct && (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {remainingPercentage}%
                  </span>
                )}
              </div>
            )}

            {/* Overflow indicator */}
            {isOverBudget && (
              <div className="absolute top-0 right-0 h-full w-2 bg-destructive rounded-r-full" />
            )}
          </div>
        </div>
        
        {/* Description for first bar */}
        <div className="flex items-center justify-between text-sm font-barlow">
          <div>
            <span className="font-semibold text-[#1E1E1E]">
              Wydane {formatCurrency(spent).replace(/\s/g, '\u00A0')}
            </span>
            <span className="text-muted-foreground ml-1">
              ({spentPercentage}%)
            </span>
          </div>
          <span className="text-muted-foreground mx-2">·</span>
          <div>
            <span className="font-semibold text-[#1E1E1E]">
              {isOverBudget ? 'Przekroczono' : 'Pozostało'} {formatCurrency(Math.abs(remaining)).replace(/\s/g, '\u00A0')}
            </span>
            <span className="text-muted-foreground ml-1">
              ({Math.abs(remainingPercentage)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Second Progress Bar: Zapłacone vs Zaliczki */}
      <div className="space-y-2">
        <div className="relative">
          <div className="w-full bg-primary-light rounded-full overflow-hidden h-6">
            {/* Paid portion */}
            <div
              className={cn(
                'h-full transition-all duration-300 ease-out bg-primary flex items-center justify-start pl-2 cursor-pointer',
                activeFilter === 'paid' && 'ring-2 ring-ring ring-offset-1'
              )}
              style={{ width: `${paidPercentage}%` }}
              onClick={() => onSegmentClick?.('paid')}
              role="button"
              tabIndex={0}
              aria-label={`Zapłacone ${paidPercentage}%, kliknij aby filtrować`}
            >
              {shouldShowPaidPct && (
                <span className="text-xs font-semibold text-white">
                  {paidPercentage}%
                </span>
              )}
            </div>
            
            {/* Deposits portion */}
            <div
              className={cn(
                'absolute top-0 h-full bg-warning flex items-center justify-center cursor-pointer transition-all duration-200',
                activeFilter === 'deposits' && 'ring-2 ring-ring ring-offset-1'
              )}
              style={{ 
                left: `${paidPercentage}%`,
                width: `${depositPercentage}%` 
              }}
              onClick={() => onSegmentClick?.('deposits')}
              role="button"
              tabIndex={0}
              aria-label={`Zaliczki ${depositPercentage}%, kliknij aby filtrować`}
            >
              {shouldShowDepositPct && (
                <span className="text-xs font-semibold text-white">
                  {depositPercentage}%
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Description for second bar */}
        <div className="flex items-center justify-between text-sm font-barlow">
          <div>
            <span className="font-semibold text-[#1E1E1E]">
              Zapłacone {formatCurrency(paidAmount).replace(/\s/g, '\u00A0')}
            </span>
            <span className="text-muted-foreground ml-1">
              ({paidPercentage}%)
            </span>
          </div>
          <span className="text-muted-foreground mx-2">·</span>
          <div>
            <span className="font-semibold text-[#1E1E1E]">
              Zaliczki {formatCurrency(depositAmount).replace(/\s/g, '\u00A0')}
            </span>
            <span className="text-muted-foreground ml-1">
              ({depositPercentage}%)
            </span>
          </div>
        </div>

        {/* Caption */}
        <p className="text-xs text-muted-foreground font-barlow mt-1">
          Wydane = Zapłacone + Zaliczki
        </p>
      </div>
    </div>
  );
}