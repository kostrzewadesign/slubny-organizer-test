import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface SetupData {
  brideFirstName: string;
  brideLastName: string;
  groomFirstName: string;
  groomLastName: string;
  weddingDate: string;
  location: string;
  budget: string;
  guestCount: string;
  notes: string;
}

export interface UserProfile {
  brideFirstName: string;
  brideLastName: string;
  groomFirstName: string;
  groomLastName: string;
  weddingDate?: string | null;
  totalBudget: number;
  guestCount: number;
  location: string;
  notes: string;
}

export function useSetup() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);

  // Check if user has completed setup - now uses setup_completed column
  const checkSetupCompletion = useCallback(async () => {
    if (!user) {
      console.log('🔄 useSetup: No user found for setup check');
      return false;
    }

    try {
      console.log('🔄 useSetup: Checking setup completion for user:', user.id);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('setup_completed')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const isComplete = !!profile?.setup_completed;

      console.log('🔍 useSetup: Setup completion status:', isComplete);
      
      setIsSetupComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('❌ useSetup: Error checking setup completion:', error);
      setIsSetupComplete(false);
      return false;
    }
  }, [user]);

  // Save setup data to Supabase
  const saveSetupData = async (setupData: SetupData) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      console.log('🔄 useSetup: Saving setup data for user:', user.id);

      // 1. Update user profile (NOT upsert - we need to preserve existing fields!)
      // First, get current profile to preserve has_completed_onboarding
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, setup_completed')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 useSetup: Current profile before update:', {
        has_completed_onboarding: currentProfile?.has_completed_onboarding,
        setup_completed: currentProfile?.setup_completed,
        fetchError
      });

      const onboardingValue = currentProfile?.has_completed_onboarding ?? true;
      console.log('💾 useSetup: Preserving has_completed_onboarding =', onboardingValue);

      const { error: profileError, status: profileStatus } = await supabase
        .from('user_profiles')
        .update({
          bride_first_name: setupData.brideFirstName?.trim() || '',
          bride_last_name: setupData.brideLastName?.trim() || '',
          groom_first_name: setupData.groomFirstName?.trim() || '',
          groom_last_name: setupData.groomLastName?.trim() || '',
          wedding_date: setupData.weddingDate || null,
          total_budget: setupData.budget ? Number(setupData.budget) : 0,
          guest_count: setupData.guestCount ? Number(setupData.guestCount) : 50,
          location: setupData.location?.trim() || '',
          notes: setupData.notes?.trim() || '',
          setup_completed: true,
          setup_completed_at: new Date().toISOString(),
          // CRITICAL: Preserve has_completed_onboarding!
          has_completed_onboarding: onboardingValue,
        })
        .eq('user_id', user.id);

      console.log('📝 useSetup: Update result:', { profileError, profileStatus });

      if (profileError) {
        console.error('❌ useSetup: Profile update failed:', {
          status: profileStatus,
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });
        throw new Error(profileError.message || 'Nie udało się zapisać profilu.');
      }

      // Verify the update worked
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('user_profiles')
        .select('has_completed_onboarding, setup_completed, bride_first_name, groom_first_name')
        .eq('user_id', user.id)
        .single();

      console.log('✅ useSetup: Profile after update:', {
        has_completed_onboarding: verifyProfile?.has_completed_onboarding,
        setup_completed: verifyProfile?.setup_completed,
        bride_first_name: verifyProfile?.bride_first_name,
        groom_first_name: verifyProfile?.groom_first_name,
        verifyError
      });

      // 2. Create/Get wedding couple's table
      let coupleTableId: string;

      // First check if couple table already exists
      const { data: existingTable } = await supabase
        .from('tables')
        .select('id')
        .eq('user_id', user.id)
        .or('name.eq.Stół Pary Młodej,name.eq.Para Młoda')
        .maybeSingle();

      if (existingTable) {
        console.log('✅ useSetup: Couple table already exists, using it');
        coupleTableId = existingTable.id;
      } else {
        console.log('🔄 useSetup: Creating couple table');
        const { data: tableData, error: tableError, status: tableStatus } = await supabase
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

        if (tableError) {
          console.error('[setup] Table creation failed:', {
            status: tableStatus,
            code: tableError.code,
            message: tableError.message,
            details: tableError.details,
          });
          throw new Error(tableError.message || 'Nie udało się utworzyć stołu pary młodej.');
        }
        
        coupleTableId = tableData.id;
      }

      // 3. Add couple as guests if they provided names
      if (setupData.brideFirstName && setupData.groomFirstName) {
        console.log('🔄 useSetup: Adding couple as guests...');

        // Check if couple already exists (to avoid duplicates)
        const { data: existingCouple } = await supabase
          .from('guests')
          .select('id, role')
          .eq('user_id', user.id)
          .in('role', ['bride', 'groom']);

        let brideData: any = null;
        let groomData: any = null;

        if (existingCouple && existingCouple.length > 0) {
          console.log('⚠️ useSetup: Couple already exists, skipping guest creation');
        } else {
          // Add bride
          const { data: brideInsert, error: brideErr, status: brideStatus } = await supabase
            .from('guests')
            .insert({
            user_id: user.id,
            first_name: setupData.brideFirstName.trim(),
              last_name: setupData.brideLastName?.trim() || '',
              role: 'bride',
              is_linked_to_profile: true,
              special_icon: 'bride',
              guest_group: 'couple',
              rsvp_status: 'confirmed',
              status: 'invited',
              accommodation: false,
              transport: false,
              is_child: false,
              is_service_provider: false,
              discount_type: 'none',
              table_assignment: coupleTableId,
            })
            .select('id')
            .single();

          if (brideErr) {
            console.error('[setup] Bride insert failed:', {
              status: brideStatus,
              code: brideErr.code,
              message: brideErr.message,
              details: brideErr.details,
              hint: brideErr.hint,
            });
            // Don't throw - make it non-critical
            console.warn('⚠️ useSetup: Failed to add bride, continuing anyway');
          } else {
            brideData = brideInsert;
          }

          // Add groom
          const { data: groomInsert, error: groomErr, status: groomStatus } = await supabase
            .from('guests')
            .insert({
            user_id: user.id,
            first_name: setupData.groomFirstName.trim(),
              last_name: setupData.groomLastName?.trim() || '',
              role: 'groom',
              is_linked_to_profile: true,
              special_icon: 'groom',
              guest_group: 'couple',
              rsvp_status: 'confirmed',
              status: 'invited',
              accommodation: false,
              transport: false,
              is_child: false,
              is_service_provider: false,
              discount_type: 'none',
              table_assignment: coupleTableId,
            })
            .select('id')
            .single();

          if (groomErr) {
            console.error('[setup] Groom insert failed:', {
              status: groomStatus,
              code: groomErr.code,
              message: groomErr.message,
              details: groomErr.details,
              hint: groomErr.hint,
            });
            // Don't throw - make it non-critical
            console.warn('⚠️ useSetup: Failed to add groom, continuing anyway');
          } else {
            groomData = groomInsert;
          }
        }
        
        // 4. Create table assignments with seat numbers
        if (brideData && groomData) {
          const assignments = [
            {
              user_id: user.id,
              table_id: coupleTableId,
              guest_id: brideData.id,
              seat_number: 1
            },
            {
              user_id: user.id,
              table_id: coupleTableId,
              guest_id: groomData.id,
              seat_number: 2
            }
          ];

          const { error: assignmentError } = await supabase
            .from('table_assignments')
            .insert(assignments);

          if (assignmentError) {
            console.warn('⚠️ useSetup: Assignment error (non-critical):', assignmentError);
          }
        }
        
        console.log('✅ useSetup: Guests added successfully', { 
          brideId: brideData?.id, 
          groomId: groomData?.id 
        });
      }

      // Mark setup as complete immediately after successful save
      setIsSetupComplete(true);
      console.log('✅ useSetup: Setup saved successfully');
      
      return true;
    } catch (error) {
      console.error('❌ useSetup: Error saving setup data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get user profile data - memoized to prevent infinite loops
  const getUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    console.log('🔍 [useSetup.getUserProfile] Starting fetch for user:', user?.id);

    if (!user) {
      console.log('⚠️ [useSetup.getUserProfile] No user found, returning null');
      return null;
    }

    try {
      console.log('🔍 [useSetup.getUserProfile] Querying user_profiles table...');

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('bride_first_name, bride_last_name, groom_first_name, groom_last_name, wedding_date, total_budget, guest_count, location, notes')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 [useSetup.getUserProfile] Query result:', {
        profile,
        error,
        hasData: !!profile
      });

      if (error) {
        console.error('❌ [useSetup.getUserProfile] Query error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      const result = {
        brideFirstName: profile.bride_first_name || '',
        brideLastName: profile.bride_last_name || '',
        groomFirstName: profile.groom_first_name || '',
        groomLastName: profile.groom_last_name || '',
        weddingDate: profile.wedding_date,
        totalBudget: profile.total_budget || 0,
        guestCount: profile.guest_count || 50,
        location: profile.location || '',
        notes: profile.notes || '',
      };

      console.log('✅ [useSetup.getUserProfile] Returning profile:', result);
      return result;
    } catch (error) {
      console.error('❌ [useSetup.getUserProfile] Exception:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkSetupCompletion();
    }
  }, [user, checkSetupCompletion]);

  // Update couple names when profile changes
  const updateCoupleNames = useCallback(async (profileData: {
    bride_first_name?: string;
    bride_last_name?: string;
    groom_first_name?: string;
    groom_last_name?: string;
  }) => {
    if (!user?.id) return;

    try {
      // Update bride guest (all 4 fields always)
      await supabase
        .from('guests')
        .update({
          first_name: profileData.bride_first_name || '',
          last_name: profileData.bride_last_name || ''
        })
        .eq('user_id', user.id)
        .eq('role', 'bride')
        .eq('is_linked_to_profile', true);

      // Update groom guest (all 4 fields always)
      await supabase
        .from('guests')
        .update({
          first_name: profileData.groom_first_name || '',
          last_name: profileData.groom_last_name || ''
        })
        .eq('user_id', user.id)
        .eq('role', 'groom')
        .eq('is_linked_to_profile', true);

      console.log('✅ useSetup: Couple names updated in guests table');
    } catch (error) {
      console.error('Error updating couple names:', error);
    }
  }, [user?.id]);

  return {
    loading,
    isSetupComplete,
    checkSetupCompletion,
    saveSetupData,
    getUserProfile,
    updateCoupleNames,
  };
}