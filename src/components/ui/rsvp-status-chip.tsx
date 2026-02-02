import React from 'react';
import { cn } from '@/lib/utils';
import { getRSVPChipConfig, type RSVPStatus } from '@/lib/rsvp-types';

interface RSVPStatusChipProps {
  status: RSVPStatus;
  className?: string;
}

export function RSVPStatusChip({ status, className }: RSVPStatusChipProps) {
  const config = getRSVPChipConfig(status);
  
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
      {status === 'declined' ? (
        <span>{config.fullLabel}</span>
      ) : (
        <>
          <span className="hidden sm:block">{config.fullLabel}</span>
          <span className="block sm:hidden">{config.shortLabel}</span>
        </>
      )}
    </div>
  );
}