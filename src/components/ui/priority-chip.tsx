import React from 'react';
import { cn } from '@/lib/utils';

interface PriorityChipProps {
  isPriority: boolean;
  isCompleted?: boolean;
  className?: string;
}

export function PriorityChip({ isPriority, isCompleted = false, className }: PriorityChipProps) {
  if (!isPriority) return null;
  
  const config = {
    color: isCompleted 
      ? 'bg-primary/10 text-primary border-primary/20' 
      : 'bg-destructive/10 text-destructive border-destructive/20',
    dotColor: isCompleted ? 'bg-primary' : 'bg-destructive',
    shortLabel: 'Pilne',
    ariaLabel: 'Zadanie priorytetowe'
  };
  
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
      <span>{config.shortLabel}</span>
    </div>
  );
}