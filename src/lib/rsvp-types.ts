/**
 * Unified RSVP types and utilities for the guest management system
 * This is the single source of truth for RSVP status handling
 */

export type RSVPStatus = 'confirmed' | 'declined' | 'pending';

export const RSVP_LABELS: Record<RSVPStatus, string> = {
  'confirmed': 'POTWIERDZONE', 
  'declined': 'ODMÓWIONE',
  'pending': 'OCZEKUJE'
};

export const RSVP_SHORT_LABELS: Record<RSVPStatus, string> = {
  'confirmed': 'Potw.',
  'declined': 'Odm.',
  'pending': 'Oczek.'
};

/**
 * Get RSVP chip configuration for UI components
 */
export function getRSVPChipConfig(status: RSVPStatus) {
  const configs = {
    'confirmed': {
      color: 'bg-primary/10 text-primary border-primary/20',
      dotColor: 'bg-primary',
      shortLabel: RSVP_SHORT_LABELS.confirmed,
      fullLabel: RSVP_LABELS.confirmed,
      ariaLabel: 'Status RSVP: potwierdzony'
    },
    'declined': {
      color: 'bg-danger/10 text-danger border-danger/20',
      dotColor: 'bg-danger',
      shortLabel: RSVP_SHORT_LABELS.declined,
      fullLabel: RSVP_LABELS.declined,
      ariaLabel: 'Status RSVP: odmówił'
    },
    'pending': {
      color: 'bg-warning/10 text-warning-foreground border-warning/20',
      dotColor: 'bg-warning',
      shortLabel: RSVP_SHORT_LABELS.pending,
      fullLabel: RSVP_LABELS.pending,
      ariaLabel: 'Status RSVP: oczekuje'
    }
  };
  
  return configs[status];
}