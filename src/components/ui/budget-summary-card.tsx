import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BudgetSummaryCardProps {
  totalBudget: number;
  spent: number;
  remaining: number;
  paidAmount: number;
  depositAmount: number;
  onEditBudget: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function BudgetSummaryCard({
  totalBudget,
  spent,
  remaining,
  paidAmount,
  depositAmount,
  onEditBudget
}: BudgetSummaryCardProps) {
  const spentTotal = paidAmount + depositAmount;
  const usagePercentage = totalBudget > 0 ? Math.min((spentTotal / totalBudget) * 100, 100) : 0;
  
  // SVG dimensions for the semi-circle
  const size = 200;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle circumference
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (usagePercentage / 100) * circumference;


  return (
    <Card className="!bg-transparent !shadow-none !border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-cormorant font-bold text-neutral">
          Budżet całkowity
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEditBudget}
          className="h-8 px-3 text-primary hover:bg-primary/10 font-barlow text-sm"
        >
          Edytuj
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Total Budget Display */}
        <div className="text-center">
          <div className="text-3xl font-cormorant font-bold text-neutral mb-2">
            {formatCurrency(totalBudget)}
          </div>
        </div>

        {/* Budget Stats */}
        <div className="flex justify-between items-center">
          {/* Spent Amount */}
          <div className="flex flex-col items-center flex-1 text-center">
            <div className="text-lg font-cormorant font-semibold text-primary mb-1">
              Wydane
            </div>
            <div className="text-xl font-barlow font-bold text-neutral">
              {formatCurrency(spentTotal)}
            </div>
            <div className="text-sm text-neutral/70 font-barlow mt-1">
              Zapłacone + Zaliczki
            </div>
          </div>
          
          {/* Separator */}
          <div className="w-px h-12 bg-border mx-4"></div>
          
          {/* Remaining Amount */}
          <div className="flex flex-col items-center flex-1 text-center">
            <div className="text-lg font-cormorant font-semibold text-neutral mb-1">
              Pozostało
            </div>
            <div className="text-xl font-barlow font-bold text-neutral">
              {formatCurrency(Math.max(0, totalBudget - spentTotal))}
            </div>
            <div className="text-sm text-neutral/70 font-barlow mt-1">
              Do wydania
            </div>
          </div>
        </div>

        {/* Semi-circular Progress Chart */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg
              width={size}
              height={size / 2 + 20}
              className="transform rotate-0"
              viewBox={`0 0 ${size} ${size / 2 + 20}`}
            >
              {/* Background arc */}
              <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke="hsla(73, 51%, 94%, 1)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              
              {/* Progress arc */}
              <path
                d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Percentage display */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
              <div className="text-3xl font-cormorant font-bold text-neutral">
                {Math.round(usagePercentage)}%
              </div>
              <div className="text-sm text-neutral/70 font-barlow">
                wykorzystano
              </div>
            </div>
          </div>
          
          {/* Chart legend */}
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm font-barlow text-neutral/70">Wydane</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsla(73, 51%, 94%, 1)' }}></div>
              <span className="text-sm font-barlow text-neutral/70">Pozostało</span>
            </div>
          </div>
        </div>

        {/* Budget warnings */}
        {spentTotal > totalBudget && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="text-sm font-barlow text-destructive">
              ⚠️ Przekroczono budżet o {formatCurrency(spentTotal - totalBudget)}
            </div>
          </div>
        )}
        
        {totalBudget > 0 && remaining < (totalBudget * 0.1) && remaining > 0 && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <div className="text-sm font-barlow text-warning">
              ⚠️ Pozostało mniej niż 10% budżetu
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}