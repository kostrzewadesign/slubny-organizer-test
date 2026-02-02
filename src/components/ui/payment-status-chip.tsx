import React from 'react';
import { cn } from '@/lib/utils';

interface PaymentStatusChipProps {
  status: 'paid' | 'deposit_paid' | 'none' | 'deposit_only';
  className?: string;
}

const statusConfig = {
  'paid': {
    color: 'bg-primary/10 text-primary border-primary/20',
    dotColor: 'bg-primary',
    shortLabel: 'Zapł.',
    fullLabel: 'ZAPŁACONE',
    ariaLabel: 'Status płatności: zapłacone'
  },
  'deposit_paid': {
    color: 'bg-primary/10 text-primary border-primary/20',
    dotColor: 'bg-primary',
    shortLabel: 'Zal. zapł.',
    fullLabel: 'ZALICZKA ZAPŁACONA',
    ariaLabel: 'Status płatności: zaliczka zapłacona'
  },
  'deposit_only': {
    color: 'bg-warning/10 text-warning-foreground border-warning/20',
    dotColor: 'bg-warning',
    shortLabel: 'Zal.',
    fullLabel: 'ZALICZKA',
    ariaLabel: 'Status płatności: zaliczka do wpłaty'
  },
  'none': {
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    dotColor: 'bg-destructive',
    shortLabel: 'Do zapł.',
    fullLabel: 'DO ZAPŁATY',
    ariaLabel: 'Status płatności: do zapłaty'
  }
};

export function PaymentStatusChip({ status, className }: PaymentStatusChipProps) {
  const config = statusConfig[status];
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-wedding uppercase',
        'h-5 min-h-5',
        config.color,
        className
      )}
      aria-label={config.ariaLabel}
    >
      <div className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />
      <span className="hidden sm:block">{config.fullLabel}</span>
      <span className="block sm:hidden">{config.shortLabel}</span>
    </div>
  );
}