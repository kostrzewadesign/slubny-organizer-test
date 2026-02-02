import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { guestAdapter } from '@/lib/supabase-adapters';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { sanitizeGuestData, logSecurityEvent, updateSessionActivity } from '@/lib/security';
import { type RSVPStatus } from '@/lib/rsvp-types';
import { GuestInputSchema } from '@/lib/guest-validation';
import { toast } from '@/hooks/use-toast';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string | null;
  group: GuestGroup;
  status: 'adult' | 'child';
  childAge?: number;
  rsvpStatus: 'confirmed' | 'declined' | 'pending';
  email?: string;
  phone?: string;
  accommodation: boolean;
  transport: boolean;
  dietaryRestrictions?: string;
  isChild: boolean;
  isServiceProvider: boolean;
  discountType: 'none' | 'discount' | 'free';
  companionOfGuestId?: string;
  tableAssignment?: string;
  seatIndex?: number | null; // Added: seat position at table (0-based)
  notes?: string;
  createdAt: Date;
  role?: 'bride' | 'groom' | 'guest' | 'vendor';
  isLinkedToProfile?: boolean;
  specialIcon?: string;
}

export type GuestGroup = 
  | 'couple' 
  | 'close-family' 
  | 'extended-family' 
  | 'witnesses' 
  | 'friends' 
  | 'colleagues' 
  | 'service-providers'
  | string;

export const guestGroupLabels: Record<string, string> = {
  'couple': 'Para Młoda',
  'close-family': 'Najbliższa rodzina',
  'extended-family': 'Dalsza rodzina',
  'witnesses': 'Świadkowie',
  'friends': 'Znajomi',
  'children': 'Dzieci',
  'service-providers': 'Usługodawcy',
  'honorary-guests': 'Goście honorowi / Inne',
  'declined-guests': 'Odmówili udziału'
};

// localStorage key helpers for per-user storage
const LEGACY_CUSTOM_GROUPS_KEY = 'wedding-custom-groups';
const customGroupsKey = (userId: string) => `custom-groups-${userId}`;

interface GuestContextType {
  guests: Guest[];
  loading: boolean;
  // Computed stats
  totalInvited: number;
  attendingGuestsCount: number; // Guests who are NOT declined - for seating calculations
  confirmedCount: number;
  declinedCount: number;
  pendingCount: number;
  guestsByGroup: Record<GuestGroup, Guest[]>;
  groupCounts: Record<GuestGroup, number>;
  availableGroups: Record<string, string>;
  // Detailed attribute counts
  adultsCount: number;
  childrenCount: number;
  serviceProvidersCount: number;
  transportCount: number;
  accommodationCount: number;
  dietaryRestrictionsCount: number;
  companionsCount: number;
  discountCount: number;
  freeCount: number;
  totalDiscountedCount: number;
  // Confirmed guests detailed statistics
  confirmedAdultsCount: number;
  confirmedChildrenCount: number;
  confirmedServiceProvidersCount: number;
  confirmedAccommodationCount: number;
  confirmedTransportCount: number;
  confirmedDietaryRestrictionsCount: number;
  confirmedDiscountCount: number;
  // Guests without declined (for summary)
  adultsCountWithoutDeclined: number;
  childrenCountWithoutDeclined: number;
  serviceProvidersCountWithoutDeclined: number;
  accommodationCountWithoutDeclined: number;
  transportCountWithoutDeclined: number;
  dietaryRestrictionsCountWithoutDeclined: number;
  discountCountWithoutDeclined: number;
  // Actions
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt'>) => Promise<Guest | undefined>;
  updateGuest: (guestId: string, updates: Partial<Omit<Guest, 'id' | 'createdAt'>>) => Promise<void>;
  deleteGuest: (guestId: string) => Promise<void>;
  updateRSVP: (guestId: string, status: Guest['rsvpStatus']) => Promise<void>;
  addCustomGroup: (groupKey: string, groupLabel: string) => void;
  editGroupName: (oldGroupKey: string, newGroupLabel: string) => void;
  resetAllData: () => void;
  resetGuestsToTemplate: () => void;
  reloadGuests: () => Promise<void>;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export function useGuests() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuests must be used within a GuestProvider');
  }
  return context;
}

// Template guests - only the couple
const defaultGuests: Guest[] = [
  {
    id: 'bride-template',
    firstName: 'Panna Młoda',
    lastName: '',
    group: 'couple',
    status: 'adult',
    rsvpStatus: 'confirmed',
    accommodation: false,
    transport: false,
    isChild: false,
    isServiceProvider: false,
    discountType: 'none',
    tableAssignment: 'couple-table-template',
    createdAt: new Date()
  },
  {
    id: 'groom-template',
    firstName: 'Pan Młody',
    lastName: '',
    group: 'couple',
    status: 'adult',
    rsvpStatus: 'confirmed',
    accommodation: false,
    transport: false,
    isChild: false,
    isServiceProvider: false,
    discountType: 'none',
    tableAssignment: 'couple-table-template',
    createdAt: new Date()
  }
];

interface GuestProviderProps {
  children: ReactNode;
}

export function GuestProvider({ children }: GuestProviderProps) {
  const { user, loading: authLoading, authReady } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Record<string, string>>(() => ({ ...guestGroupLabels }));
  const [loading, setLoading] = useState(true);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  // Load data from Supabase when user is authenticated
  const loadData = useCallback(async () => {
    console.log('🔄 [GuestContext.loadData] Starting...', {
      hasUser: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    if (!user) {
      // User not authenticated, clear data
      console.log('⚠️ [GuestContext.loadData] No user, clearing data');
      setGuests([]);
      setAvailableGroups({ ...guestGroupLabels });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Session is already ready (authReady === true), no need to wait
      // Log guest data access for security audit
      void logSecurityEvent('SELECT_guest', {
        userId: user.id,
        metadata: { action: 'load_all_guests', timestamp: new Date().toISOString() }
      }).catch(err => console.warn('[GuestContext] Audit log failed:', err));
      updateSessionActivity(user.id);

      console.log('🔄 [GuestContext.loadData] Calling guestAdapter.getGuests()...');
      // Load guests from Supabase
      const loadedGuests = await guestAdapter.getGuests();
      console.log('✅ [GuestContext.loadData] Loaded guests:', loadedGuests.length);
      
      // Convert adapter types to context types and sanitize data
      const guestsWithCompatibleTypes = loadedGuests.map(guest => {
        const sanitizedGuest = sanitizeGuestData(guest);
        console.log('Loading guest from DB:', sanitizedGuest.firstName, 'role:', sanitizedGuest.role, 'status:', sanitizedGuest.status, 'rsvp:', sanitizedGuest.rsvpStatus, 'isChild:', sanitizedGuest.isChild);
        return {
          ...sanitizedGuest,
          createdAt: new Date(sanitizedGuest.createdAt),
          status: sanitizedGuest.isChild ? 'child' : 'adult',
          rsvpStatus: (sanitizedGuest.rsvpStatus || 'pending') as 'sent' | 'confirmed' | 'declined' | 'pending',
          discountType: (['none', 'discount', 'free'].includes(sanitizedGuest.discountType || 'none') ? sanitizedGuest.discountType : 'none') as 'none' | 'discount' | 'free',
          role: sanitizedGuest.role,
          isLinkedToProfile: sanitizedGuest.isLinkedToProfile,
          specialIcon: sanitizedGuest.specialIcon,
        };
      });
      
      setGuests(guestsWithCompatibleTypes);
      
      // Load custom groups per-user with legacy migration
      if (user?.id) {
        const userKey = customGroupsKey(user.id);
        let savedGroups = localStorage.getItem(userKey);
        
        // One-time migration from legacy global key
        if (!savedGroups) {
          const legacyGroups = localStorage.getItem(LEGACY_CUSTOM_GROUPS_KEY);
          if (legacyGroups) {
            console.debug('[GuestContext] Migrating custom groups from legacy key to per-user key');
            localStorage.setItem(userKey, legacyGroups);
            localStorage.removeItem(LEGACY_CUSTOM_GROUPS_KEY);
            savedGroups = legacyGroups;
          }
        }
        
        if (savedGroups) {
          try {
            const parsedGroups = JSON.parse(savedGroups);
            setAvailableGroups({ ...guestGroupLabels, ...parsedGroups });
          } catch (error) {
            console.error('[GuestContext] Error parsing custom groups:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading guests:', error);
      
      toast({
        title: "Błąd wczytywania gości",
        description: "Nie udało się wczytać listy gości. Sprawdź połączenie internetowe i odśwież stronę.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    console.log('[GuestContext] Effect triggered:', { 
      authReady, 
      userId: user?.id, 
      lastLoaded: lastLoadedUserIdRef.current 
    });
    
    // Wait for auth to be resolved
    if (!authReady) {
      console.log('[GuestContext] Auth not ready, waiting...');
      return;
    }
    
    // No user - clear data
    if (!user) {
      console.log('[GuestContext] No user - clearing data');
      setGuests([]);
      setAvailableGroups({ ...guestGroupLabels });
      setLoading(false);
      lastLoadedUserIdRef.current = null;
      return;
    }
    
    // Skip if already loaded for this user
    if (lastLoadedUserIdRef.current === user.id) {
      console.log('[GuestContext] Data already loaded for user:', user.id);
      return;
    }
    
    // Load data for new user
    console.log('[GuestContext] Loading data for user:', user.id);
    lastLoadedUserIdRef.current = user.id;
    loadData();
    
  }, [authReady, user?.id, loadData]);

  // Subscribe to realtime changes in guests table
  useEffect(() => {
    if (!authReady || !user?.id) return;
    
    console.log('🔄 GuestContext: Setting up realtime subscription for user:', user.id);
    
    const channel = supabase
      .channel('guests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 GuestContext: Realtime update detected', payload);
          loadData(); // Reload when changes detected
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 GuestContext: Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadData]);

  // Save custom groups to localStorage whenever they change (per-user)
  useEffect(() => {
    // Don't save if no user (prevents cross-user leakage)
    if (!user?.id) {
      console.debug('[GuestContext] No user - skipping custom groups save');
      return;
    }
    
    const customGroups = Object.fromEntries(
      Object.entries(availableGroups).filter(([key]) => !guestGroupLabels[key])
    );
    
    const userKey = customGroupsKey(user.id);
    
    if (Object.keys(customGroups).length > 0) {
      try {
        localStorage.setItem(userKey, JSON.stringify(customGroups));
      } catch (error) {
        console.error('[GuestContext] Error saving custom groups to localStorage:', error);
      }
    } else {
      // Clean up if no custom groups
      localStorage.removeItem(userKey);
    }
  }, [availableGroups, user?.id]);

  // Computed values - memoized for performance
  const totalInvited = useMemo(() => guests.length, [guests.length]);
  const attendingGuestsCount = useMemo(() => guests.filter(guest => guest.rsvpStatus !== 'declined').length, [guests]); // Exclude declined guests for seating
  const confirmedCount = useMemo(() => guests.filter(guest => guest.rsvpStatus === 'confirmed').length, [guests]);
  const declinedCount = useMemo(() => guests.filter(guest => guest.rsvpStatus === 'declined').length, [guests]);
  const pendingCount = useMemo(() => guests.filter(guest => guest.rsvpStatus === 'pending').length, [guests]);

  // Initialize all available groups with empty arrays first - memoized
  const guestsByGroup = useMemo(() => {
    const groups = Object.keys(availableGroups).reduce((acc, groupKey) => {
      acc[groupKey as GuestGroup] = [];
      return acc;
    }, {} as Record<GuestGroup, Guest[]>);

    // Then populate with actual guests
    guests.forEach(guest => {
      // Move declined guests to special declined category
      if (guest.rsvpStatus === 'declined') {
        if (!groups['declined-guests']) {
          groups['declined-guests'] = [];
        }
        groups['declined-guests'].push(guest);
      } else {
        // Keep other guests in their original groups
        if (groups[guest.group]) {
          groups[guest.group].push(guest);
        }
      }
    });

    return groups;
  }, [guests, availableGroups]);

  const groupCounts = useMemo(() => {
    return Object.entries(guestsByGroup).reduce((acc, [group, guestList]) => {
      acc[group as GuestGroup] = guestList.length;
      return acc;
    }, {} as Record<GuestGroup, number>);
  }, [guestsByGroup]);

  // Confirmed guests for detailed statistics
  const confirmedGuests = useMemo(
    () => guests.filter(g => g.rsvpStatus === 'confirmed'),
    [guests]
  );

  // Detailed attribute counts - memoized for performance
  const adultsCount = useMemo(() => guests.filter(guest => guest.status === 'adult').length, [guests]);
  const childrenCount = useMemo(() => guests.filter(guest => guest.status === 'child').length, [guests]);
  const serviceProvidersCount = useMemo(() => guests.filter(guest => guest.isServiceProvider).length, [guests]);
  
  const transportCount = useMemo(() => guests.filter(guest => guest.transport).length, [guests]);
  const accommodationCount = useMemo(() => guests.filter(guest => guest.accommodation).length, [guests]);
  const dietaryRestrictionsCount = useMemo(() => guests.filter(guest => guest.dietaryRestrictions && guest.dietaryRestrictions.trim().length > 0).length, [guests]);
  const companionsCount = useMemo(() => guests.filter(guest => guest.companionOfGuestId).length, [guests]);
  
  // Discount counts - memoized
  const discountCount = useMemo(() => guests.filter(guest => guest.discountType === 'discount').length, [guests]);
  const freeCount = useMemo(() => guests.filter(guest => guest.discountType === 'free').length, [guests]);
  const totalDiscountedCount = useMemo(() => guests.filter(guest => guest.discountType !== 'none').length, [guests]);

  // Confirmed guests detailed statistics
  const confirmedAdultsCount = useMemo(
    () => confirmedGuests.filter(g => g.status === 'adult').length,
    [confirmedGuests]
  );
  
  const confirmedChildrenCount = useMemo(
    () => confirmedGuests.filter(g => g.status === 'child').length,
    [confirmedGuests]
  );
  
  const confirmedServiceProvidersCount = useMemo(
    () => confirmedGuests.filter(g => g.isServiceProvider).length,
    [confirmedGuests]
  );

  const confirmedAccommodationCount = useMemo(
    () => confirmedGuests.filter(g => g.accommodation).length,
    [confirmedGuests]
  );
  
  const confirmedTransportCount = useMemo(
    () => confirmedGuests.filter(g => g.transport).length,
    [confirmedGuests]
  );
  
  const confirmedDietaryRestrictionsCount = useMemo(
    () => confirmedGuests.filter(g => g.dietaryRestrictions && g.dietaryRestrictions.trim().length > 0).length,
    [confirmedGuests]
  );
  
  const confirmedDiscountCount = useMemo(
    () => confirmedGuests.filter(g => g.discountType && g.discountType !== 'none').length,
    [confirmedGuests]
  );

  // Guests without declined (for summary section)
  const guestsWithoutDeclined = useMemo(
    () => guests.filter(g => g.rsvpStatus !== 'declined'),
    [guests]
  );

  const adultsCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.status === 'adult').length,
    [guestsWithoutDeclined]
  );

  const childrenCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.status === 'child').length,
    [guestsWithoutDeclined]
  );

  const serviceProvidersCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.isServiceProvider).length,
    [guestsWithoutDeclined]
  );

  const accommodationCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.accommodation).length,
    [guestsWithoutDeclined]
  );

  const transportCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.transport).length,
    [guestsWithoutDeclined]
  );

  const dietaryRestrictionsCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.dietaryRestrictions && g.dietaryRestrictions.trim().length > 0).length,
    [guestsWithoutDeclined]
  );

  const discountCountWithoutDeclined = useMemo(
    () => guestsWithoutDeclined.filter(g => g.discountType && g.discountType !== 'none').length,
    [guestsWithoutDeclined]
  );

  const addGuest = async (guestData: Omit<Guest, 'id' | 'createdAt'>): Promise<Guest | undefined> => {
    console.log('🔵 [GuestContext] Starting addGuest with data:', guestData);
    console.log('🔵 [GuestContext] User auth state:', { hasUser: !!user, userId: user?.id ? 'present' : 'null' });
    
    // Require user authentication
    if (!user?.id) {
      throw new Error('Musisz być zalogowany aby dodać gościa');
    }
    
    try {
      // STEP 1: Prepare data for Zod validation
      const dataToValidate = {
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email || '',
        phone: guestData.phone || '',
        group: guestData.group,
        status: guestData.status,
        isChild: guestData.isChild,
        childAge: guestData.childAge,
        rsvpStatus: guestData.rsvpStatus,
        accommodation: guestData.accommodation,
        transport: guestData.transport,
        dietaryRestrictions: guestData.dietaryRestrictions || '',
        notes: guestData.notes || '',
        isServiceProvider: guestData.isServiceProvider,
        discountType: guestData.discountType,
        companionOfGuestId: guestData.companionOfGuestId || null,
      };
      
      // STEP 2: Validate with Zod schema
      const validation = GuestInputSchema.safeParse(dataToValidate);
      
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        console.error('[GuestContext] Validation failed:', validation.error);
        throw new Error(`Błąd walidacji: ${errorMessages}`);
      }
      
      // Type assertion: zod validates required fields
      const validatedData = validation.data as {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
        group: string;
        status: 'adult' | 'child';
        isChild: boolean;
        childAge?: number;
        rsvpStatus: 'sent' | 'confirmed' | 'declined' | 'pending';
        accommodation: boolean;
        transport: boolean;
        dietaryRestrictions?: string;
        notes?: string;
        isServiceProvider: boolean;
        discountType: 'none' | 'discount' | 'free';
        companionOfGuestId?: string | null;
      };
      
      console.log('🟢 Validated guest data:', validatedData);
      
      // STEP 3: Sanitize validated data
      const sanitizedGuestData = sanitizeGuestData({
        ...guestData,
        ...validatedData
      });
      console.log('🟢 Sanitized guest data:', sanitizedGuestData);
      
      // STEP 4: Log guest creation for security audit
      void logSecurityEvent('INSERT_guest', {
        userId: user.id,
        metadata: { 
          guestName: `${sanitizedGuestData.firstName} ${sanitizedGuestData.lastName}`,
          timestamp: new Date().toISOString()
        }
      }).catch(err => console.warn('[GuestContext] Audit log failed:', err));
      updateSessionActivity(user.id);
      
      // STEP 5: Convert context types to adapter types for the API call
      const adapterGuestData = {
        ...sanitizedGuestData,
        group: sanitizedGuestData.group || 'friends',
        status: sanitizedGuestData.isChild ? 'child' : 'invited',
        rsvpStatus: sanitizedGuestData.rsvpStatus || 'pending',
        accommodation: sanitizedGuestData.accommodation ?? false,
        transport: sanitizedGuestData.transport ?? false,
        isChild: sanitizedGuestData.isChild ?? false,
        isServiceProvider: sanitizedGuestData.isServiceProvider ?? false,
        discountType: sanitizedGuestData.discountType || 'none',
        firstName: String(sanitizedGuestData.firstName || '').trim(),
        lastName: String(sanitizedGuestData.lastName || '').trim()
      };
      
      console.log('🟡 Adding guest to DB:', {
        name: `${adapterGuestData.firstName} ${adapterGuestData.lastName}`,
        status: adapterGuestData.status,
        rsvp: adapterGuestData.rsvpStatus,
        isChild: adapterGuestData.isChild,
        group: adapterGuestData.group
      });
      
      const newGuest = await guestAdapter.addGuest(adapterGuestData as any);
      console.log('🟢 Guest added successfully:', newGuest);
      
      if (!newGuest) {
        throw new Error('Failed to create guest - no guest returned from adapter');
      }
      
      // Convert back to context types
      const contextGuest: Guest = {
        ...newGuest,
        createdAt: new Date(newGuest.createdAt),
        status: (newGuest.isChild ? 'child' : 'adult') as 'adult' | 'child',
        rsvpStatus: (newGuest.rsvpStatus === 'sent' ? 'pending' : newGuest.rsvpStatus || 'pending') as 'confirmed' | 'declined' | 'pending',
        discountType: (['none', 'discount', 'free'].includes(newGuest.discountType || 'none') ? newGuest.discountType : 'none') as 'none' | 'discount' | 'free'
      };
      
      console.log('🔵 Added guest to context:', {
        name: `${contextGuest.firstName} ${contextGuest.lastName}`,
        status: contextGuest.status,
        rsvp: contextGuest.rsvpStatus,
        isChild: contextGuest.isChild
      });
      
      setGuests(prev => [...prev, contextGuest]);
      return contextGuest;
    } catch (error: any) {
      console.error('❌ [GuestContext] addGuest failed:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      
      toast({
        title: "Błąd dodawania gościa",
        description: "Nie udało się dodać gościa. Sprawdź poprawność danych i spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const updateGuest = async (guestId: string, updates: Partial<Omit<Guest, 'id' | 'createdAt'>>) => {
    if (!user) return;
    
    try {
      // STEP 1: Prepare data for Zod validation (only fields that are being updated)
      const dataToValidate: any = {};
      
      if (updates.firstName !== undefined) dataToValidate.firstName = updates.firstName;
      if (updates.lastName !== undefined) dataToValidate.lastName = updates.lastName;
      if (updates.email !== undefined) dataToValidate.email = updates.email || '';
      if (updates.phone !== undefined) dataToValidate.phone = updates.phone || '';
      if (updates.group !== undefined) dataToValidate.group = updates.group;
      if (updates.status !== undefined) dataToValidate.status = updates.status;
      if (updates.isChild !== undefined) dataToValidate.isChild = updates.isChild;
      if (updates.childAge !== undefined) dataToValidate.childAge = updates.childAge;
      if (updates.rsvpStatus !== undefined) dataToValidate.rsvpStatus = updates.rsvpStatus;
      if (updates.accommodation !== undefined) dataToValidate.accommodation = updates.accommodation;
      if (updates.transport !== undefined) dataToValidate.transport = updates.transport;
      if (updates.dietaryRestrictions !== undefined) dataToValidate.dietaryRestrictions = updates.dietaryRestrictions || '';
      if (updates.notes !== undefined) dataToValidate.notes = updates.notes || '';
      if (updates.isServiceProvider !== undefined) dataToValidate.isServiceProvider = updates.isServiceProvider;
      if (updates.discountType !== undefined) dataToValidate.discountType = updates.discountType;
      if (updates.companionOfGuestId !== undefined) dataToValidate.companionOfGuestId = updates.companionOfGuestId || null;
      
      // STEP 2: Validate with Zod schema (partial for updates)
      const validation = GuestInputSchema.partial().safeParse(dataToValidate);
      
      if (!validation.success) {
        const errorMessages = validation.error.errors.map(e => e.message).join(', ');
        console.error('[GuestContext] Update validation failed:', validation.error);
        throw new Error(`Błąd walidacji: ${errorMessages}`);
      }
      
      // Type assertion: zod validates the fields
      const validatedData = validation.data as Partial<Guest>;
      
      console.log('🟢 Validated update data:', validatedData);
      
      // STEP 3: Sanitize validated data
      const sanitizedUpdates = sanitizeGuestData({
        ...updates,
        ...validatedData
      });
      
      // STEP 4: Log guest update for security audit
      void logSecurityEvent('UPDATE_guest', {
        userId: user.id,
        targetGuestId: guestId,
        metadata: { 
          updatedFields: Object.keys(sanitizedUpdates),
          timestamp: new Date().toISOString()
        }
      }).catch(err => console.warn('[GuestContext] Audit log failed:', err));
      updateSessionActivity(user.id);
      
      // STEP 5: Convert context types to adapter types
      const adapterUpdates = {
        ...sanitizedUpdates,
        status: sanitizedUpdates.isChild ? 'child' : 'invited',
        rsvpStatus: sanitizedUpdates.rsvpStatus
      };
      
      console.log('📤 Sending updates to adapter:', { guestId, updates: adapterUpdates });
      const updatedGuest = await guestAdapter.updateGuest(guestId, adapterUpdates as any);
      console.log('📥 Received updated guest from adapter:', updatedGuest);
      
      if (!updatedGuest) {
        throw new Error('Failed to update guest - no guest returned from adapter');
      }
      
      // Convert back to context types
      const contextGuest: Guest = {
        ...updatedGuest,
        createdAt: new Date(updatedGuest.createdAt),
        status: (updatedGuest.isChild ? 'child' : 'adult') as 'adult' | 'child',
        rsvpStatus: (updatedGuest.rsvpStatus === 'attending' ? 'confirmed' : updatedGuest.rsvpStatus === 'sent' ? 'pending' : updatedGuest.rsvpStatus) as 'confirmed' | 'declined' | 'pending',
        discountType: (['none', 'discount', 'free'].includes(updatedGuest.discountType || 'none') ? updatedGuest.discountType : 'none') as 'none' | 'discount' | 'free'
      };
      
      setGuests(prev => prev.map(guest => 
        guest.id === guestId ? contextGuest : guest
      ));
    } catch (error) {
      console.error('❌ Error updating guest:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      toast({
        title: "Błąd aktualizacji gościa",
        description: "Nie udało się zaktualizować danych gościa. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error; // Re-throw to let components handle the error
    }
  };

  const deleteGuest = async (guestId: string) => {
    if (!user) return;
    
    try {
      // Log guest deletion for security audit
      void logSecurityEvent('DELETE_guest', {
        userId: user.id,
        targetGuestId: guestId,
        metadata: { timestamp: new Date().toISOString() }
      }).catch(err => console.warn('[GuestContext] Audit log failed:', err));
      updateSessionActivity(user.id);
      
      await guestAdapter.deleteGuest(guestId);
      setGuests(prev => prev.filter(guest => guest.id !== guestId));
    } catch (error) {
      console.error('Error deleting guest:', error);
      
      toast({
        title: "Błąd usuwania gościa",
        description: "Nie udało się usunąć gościa. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  const updateRSVP = async (guestId: string, status: Guest['rsvpStatus']) => {
    console.log('🔄 Updating RSVP:', { guestId, newStatus: status });
    
    try {
      // Validate RSVP status before sending to database
      const validStatuses = ['sent', 'confirmed', 'declined', 'pending', 'attending'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid RSVP status: ${status}. Valid statuses: ${validStatuses.join(', ')}`);
      }
      
      console.log('✅ RSVP status is valid, proceeding with update...');
      
      // If guest is declining, automatically remove table assignment
      if (status === 'declined') {
        const guest = guests.find(g => g.id === guestId);
        if (guest?.tableAssignment) {
          console.log('🔄 Guest declined - removing table assignment');
          await updateGuest(guestId, { 
            rsvpStatus: status,
            tableAssignment: undefined,
            seatIndex: null
          });
          console.log('✅ RSVP update + table unassignment completed successfully');
          return;
        }
      }
      
      await updateGuest(guestId, { rsvpStatus: status });
      console.log('✅ RSVP update completed successfully');
    } catch (error) {
      console.error('❌ Error updating RSVP:', error);
      
      toast({
        title: "Błąd zmiany statusu RSVP",
        description: "Nie udało się zaktualizować potwierdzenia. Spróbuj ponownie.",
        variant: "destructive",
        duration: 4000
      });
      
      throw error;
    }
  };

  // Remove this function - table assignments are now handled only by TableContext
  // const assignTable = async (guestId: string, tableId: string) => {
  //   await updateGuest(guestId, { tableAssignment: tableId });
  // };

  const addCustomGroup = (groupKey: string, groupLabel: string) => {
    setAvailableGroups(prev => ({
      ...prev,
      [groupKey]: groupLabel
    }));
  };

  const editGroupName = (oldGroupKey: string, newGroupLabel: string) => {
    const trimmedNewLabel = newGroupLabel.trim();
    if (!trimmedNewLabel || trimmedNewLabel === availableGroups[oldGroupKey]) return;
    
    // Update group label only (keep the same key)
    setAvailableGroups(prev => ({
      ...prev,
      [oldGroupKey]: trimmedNewLabel
    }));
  };

  const resetAllData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('[GuestContext] Clearing guest data');
      
      // Clear localStorage - per-user keys
      const userGuestsKey = `guests-${user.id}`;
      localStorage.removeItem(userGuestsKey);
      
      // Remove per-user custom groups
      localStorage.removeItem(customGroupsKey(user.id));
      
      // Also clear legacy keys for backward compatibility
      localStorage.removeItem('wedding-guests');
      localStorage.removeItem(LEGACY_CUSTOM_GROUPS_KEY);
      
      // Clear context state
      setGuests([]);
      setAvailableGroups({ ...guestGroupLabels });
      
      console.log('[GuestContext] Guest data cleared successfully');
    } catch (error) {
      console.error('[GuestContext] Error clearing guest data:', error);
      throw error;
    }
  };

  const resetGuestsToTemplate = async () => {
    if (!user) return;

    // CRITICAL: Verify server-side auth before deleting data
    const { data: { user: verifiedUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !verifiedUser || verifiedUser.id !== user.id) {
      console.error('[GuestContext] ❌ Auth verification failed, refusing to delete guests:', {
        authError: authError?.message,
        hasVerifiedUser: !!verifiedUser,
        idMatch: verifiedUser?.id === user.id
      });
      toast({
        title: 'Błąd autoryzacji',
        description: 'Weryfikacja autoryzacji nie powiodła się. Zaloguj się ponownie.',
        variant: 'destructive'
      });
      return;
    }

    console.log('[GuestContext] ⚠️ resetGuestsToTemplate called - this will DELETE all guests!');

    setLoading(true);
    try {
      // Clear all existing guests
      const { error: deleteError } = await supabase
        .from('guests')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Clear table assignments
      await supabase
        .from('table_assignments')
        .delete()
        .eq('user_id', user.id);

      // Clear all tables
      await supabase
        .from('tables')
        .delete()
        .eq('user_id', user.id);
      
      // Get user profile to recreate couple
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('bride_name, groom_name')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.bride_name && profile?.groom_name) {
        // Recreate wedding couple's table
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .insert({
            user_id: user.id,
            name: 'Stół Pary Młodej',
            seats: 6,
            table_type: 'main_couple',
            notes: 'Główny stół dla pary młodej i najbliższych'
          })
          .select()
          .single();

        if (tableError) throw tableError;

        // Add bride and groom as guests
        const guestsToInsert = [
          {
            user_id: user.id,
            first_name: profile.bride_name,
            last_name: '',
            role: 'bride' as const,
            guest_group: 'para_mloda',
            rsvp_status: 'confirmed',
            status: 'invited',
            accommodation: false,
            transport: false,
            is_child: false,
            is_service_provider: false,
            table_assignment: tableData.id,
          },
          {
            user_id: user.id,
            first_name: profile.groom_name,
            last_name: '',
            role: 'groom' as const,
            guest_group: 'para_mloda',
            rsvp_status: 'confirmed',
            status: 'invited',
            accommodation: false,
            transport: false,
            is_child: false,
            is_service_provider: false,
            table_assignment: tableData.id,
          }
        ];

        const { data: insertedGuests, error: guestError } = await supabase
          .from('guests')
          .insert(guestsToInsert)
          .select();

        if (guestError) throw guestError;

        // Create table assignments
        if (insertedGuests && insertedGuests.length === 2) {
          const assignments = insertedGuests.map(guest => ({
            user_id: user.id,
            table_id: tableData.id,
            guest_id: guest.id
          }));

          await supabase
            .from('table_assignments')
            .insert(assignments);
        }
      }
      
      // Refresh guest data using adapter
      const refreshedGuests = await guestAdapter.getGuests();
      setGuests(refreshedGuests.map(guest => ({
        ...guest,
        status: guest.status === 'invited' ? 'adult' : guest.status as 'adult' | 'child',
        rsvpStatus: guest.rsvpStatus === 'attending' ? 'confirmed' : guest.rsvpStatus === 'sent' ? 'pending' : guest.rsvpStatus as 'confirmed' | 'declined' | 'pending',
        discountType: guest.discountType as 'none' | 'discount' | 'free',
        createdAt: new Date(guest.createdAt)
      })));
      setAvailableGroups({ ...guestGroupLabels });
      
    } catch (error) {
      console.error('Error resetting guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const reloadGuests = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const value: GuestContextType = useMemo(() => ({
    guests,
    loading,
    totalInvited,
    attendingGuestsCount,
    confirmedCount,
    declinedCount,
    pendingCount,
    guestsByGroup,
    groupCounts,
    availableGroups,
    adultsCount,
    childrenCount,
    serviceProvidersCount,
    transportCount,
    accommodationCount,
    dietaryRestrictionsCount,
    companionsCount,
    discountCount,
    freeCount,
    totalDiscountedCount,
    confirmedAdultsCount,
    confirmedChildrenCount,
    confirmedServiceProvidersCount,
    confirmedAccommodationCount,
    confirmedTransportCount,
    confirmedDietaryRestrictionsCount,
    confirmedDiscountCount,
    adultsCountWithoutDeclined,
    childrenCountWithoutDeclined,
    serviceProvidersCountWithoutDeclined,
    accommodationCountWithoutDeclined,
    transportCountWithoutDeclined,
    dietaryRestrictionsCountWithoutDeclined,
    discountCountWithoutDeclined,
    addGuest,
    updateGuest,
    deleteGuest,
    updateRSVP,
    addCustomGroup,
    editGroupName,
    resetAllData,
    resetGuestsToTemplate,
    reloadGuests
  }), [
    guests, loading, totalInvited, attendingGuestsCount, confirmedCount, declinedCount,
    pendingCount, guestsByGroup, groupCounts, availableGroups, adultsCount, childrenCount,
    serviceProvidersCount, transportCount, accommodationCount, dietaryRestrictionsCount, 
    companionsCount, discountCount, freeCount, totalDiscountedCount,
    confirmedAdultsCount, confirmedChildrenCount, confirmedServiceProvidersCount,
    confirmedAccommodationCount, confirmedTransportCount, confirmedDietaryRestrictionsCount,
    confirmedDiscountCount, adultsCountWithoutDeclined, childrenCountWithoutDeclined,
    serviceProvidersCountWithoutDeclined, accommodationCountWithoutDeclined, transportCountWithoutDeclined,
    dietaryRestrictionsCountWithoutDeclined, discountCountWithoutDeclined,
    addGuest, updateGuest, deleteGuest, updateRSVP, addCustomGroup,
    editGroupName, resetAllData, resetGuestsToTemplate, reloadGuests
  ]);

  return (
    <GuestContext.Provider value={value}>
      {children}
    </GuestContext.Provider>
  );
}
