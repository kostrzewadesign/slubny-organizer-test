import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useSetup } from '@/hooks/use-setup';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar } from '@phosphor-icons/react';
import dividerImage from '@/assets/divider.png';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTask } from '@/context/TaskContext';

export default function Settings() {
  const { getUserProfile, updateCoupleNames } = useSetup();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { updateTotalBudget } = useTask();
  
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    weddingDate: undefined as Date | undefined,
    location: '',
    budget: '',
    guestCount: ''
  });
  
  const [isSavingCouple, setIsSavingCouple] = useState(false);
  const [isSavingWedding, setIsSavingWedding] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Load existing data when component mounts
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;
      
      try {
        const profile = await getUserProfile();
        if (profile) {
          // Use firstName directly - it contains the full name
          setFormData({
            brideName: profile.brideFirstName || '',
            groomName: profile.groomFirstName || '',
            weddingDate: profile.weddingDate ? new Date(profile.weddingDate) : undefined,
            location: profile.location || '',
            budget: profile.totalBudget ? profile.totalBudget.toString() : '',
            guestCount: profile.guestCount ? profile.guestCount.toString() : ''
          });
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast({
          title: "Błąd ładowania",
          description: "Nie udało się załadować danych profilu.",
          variant: "destructive"
        });
      }
    };
    loadExistingData();
  }, [user?.id]); // Only depend on user.id to avoid infinite loops

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateCouple = async () => {
    if (!user || isSavingCouple) return;

    // Validate at least one name is provided
    if (!formData.brideName.trim() && !formData.groomName.trim()) {
      toast({
        title: "Błąd walidacji",
        description: "Proszę wypełnić przynajmniej jedno pole",
        variant: "destructive"
      });
      return;
    }

    setIsSavingCouple(true);
    try {
      // Save names exactly as entered (no splitting)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          bride_first_name: formData.brideName.trim(),
          bride_last_name: '',  // Empty
          groom_first_name: formData.groomName.trim(),
          groom_last_name: ''   // Empty
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update couple names in guests table
      await updateCoupleNames({
        bride_first_name: formData.brideName.trim(),
        bride_last_name: '',
        groom_first_name: formData.groomName.trim(),
        groom_last_name: ''
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
    } catch (error) {
      console.error('Error updating couple names:', error);
      toast({
        title: "Błąd",
        description: "Wystąpił problem podczas zapisywania. Spróbuj ponownie.",
        variant: "destructive"
      });
    } finally {
      setIsSavingCouple(false);
    }
  };

  const handleUpdateWedding = async () => {
    if (!user || isSavingWedding) return;

    // Validate all fields
    if (!formData.weddingDate || !formData.location.trim() || !formData.budget || !formData.guestCount) {
      toast({
        title: "Błąd walidacji",
        description: "Proszę wypełnić wszystkie pola szczegółów ślubu",
        variant: "destructive"
      });
      return;
    }

    const budgetNum = Number(formData.budget);
    const guestCountNum = Number(formData.guestCount);

    if (budgetNum <= 0 || guestCountNum <= 0) {
      toast({
        title: "Błąd walidacji",
        description: "Budżet i liczba gości muszą być większe od zera",
        variant: "destructive"
      });
      return;
    }

    setIsSavingWedding(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          wedding_date: formData.weddingDate.toISOString().split('T')[0],
          location: formData.location.trim(),
          total_budget: budgetNum,
          guest_count: guestCountNum
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update budget in TaskContext
      updateTotalBudget(budgetNum);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      console.error('Error updating wedding details:', error);
      toast({
        title: "Błąd",
        description: "Wystąpił problem podczas zapisywania. Spróbuj ponownie.",
        variant: "destructive"
      });
    } finally {
      setIsSavingWedding(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await signOut();
      // Navigate to auth page with logout success parameter
      navigate('/auth?logout=success', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Błąd",
        description: "Wystąpił problem podczas wylogowania. Spróbuj ponownie.",
        variant: "destructive"
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Botanical background - same as /setup */}
      <div 
        className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none" 
        style={{ backgroundImage: 'url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)' }}
      />

      {/* Back button */}
      <div className="relative z-10 p-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg md:w-12 md:h-12 md:rounded-xl md:shadow-sm"
        >
          <ArrowLeft size={24} weight="light" color="#FFFFFF" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-4 pb-12">
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-4xl md:text-5xl font-cormorant font-bold text-[#1E1E1E]">
            Ustawienia
          </h1>
          <p className="text-base text-muted-foreground font-barlow">
            Zarządzajcie kontem i preferencjami
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex justify-center mb-8">
          <img src={dividerImage} alt="" className="h-6 opacity-60" />
        </div>

        {/* Para Młoda Section */}
        <div className="space-y-5 mb-8">
          <h2 className="text-3xl font-cormorant font-semibold text-center text-[#1E1E1E]">
            Para Młoda
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brideName" className="text-neutral font-barlow text-sm">
                Imię Panny Młodej*
              </Label>
              <Input
                id="brideName"
                value={formData.brideName}
                onChange={(e) => handleInputChange('brideName', e.target.value)}
                placeholder="np. Kamila"
                className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groomName" className="text-neutral font-barlow text-sm">
                Imię Pana Młodego*
              </Label>
              <Input
                id="groomName"
                value={formData.groomName}
                onChange={(e) => handleInputChange('groomName', e.target.value)}
                placeholder="np. Robert"
                className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow"
              />
            </div>

            <Button
              onClick={handleUpdateCouple}
              disabled={isSavingCouple}
              className="w-full h-14 rounded-2xl text-base font-barlow font-medium bg-primary hover:bg-primary-dark text-white shadow-lg"
            >
              {isSavingCouple ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>

        {/* Szczegóły ślubu Section */}
        <div className="space-y-5 mb-8">
          {/* Decorative divider */}
          <div className="flex justify-center mb-2">
            <img src={dividerImage} alt="" className="h-6 opacity-60" />
          </div>
          
          <h2 className="text-3xl font-cormorant font-semibold text-center text-[#1E1E1E]">
            Szczegóły ślubu
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weddingDate" className="text-neutral font-barlow text-sm">
                Data ślubu*
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted z-10 pointer-events-none" weight="light" />
                <DatePicker
                  date={formData.weddingDate}
                  onSelect={(date) => handleInputChange('weddingDate', date)}
                  placeholder="Wybierz datę ślubu"
                  className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white pl-12 text-base font-barlow"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-neutral font-barlow text-sm">
                Miejscowość*
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Wpisz miejscowość"
                className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-neutral font-barlow text-sm">
                Budżet*
              </Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Wpisz budżet w PLN"
                className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestCount" className="text-neutral font-barlow text-sm">
                Ilość Gości*
              </Label>
              <Input
                id="guestCount"
                type="number"
                value={formData.guestCount}
                onChange={(e) => handleInputChange('guestCount', e.target.value)}
                placeholder="Wpisz liczbę gości"
                className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow"
              />
            </div>

            <Button
              onClick={handleUpdateWedding}
              disabled={isSavingWedding}
              className="w-full h-14 rounded-2xl text-base font-barlow font-medium bg-primary hover:bg-primary-dark text-white shadow-lg"
            >
              {isSavingWedding ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>

        {/* Divider before sign out */}
        <div className="flex justify-center my-8">
          <img src={dividerImage} alt="" className="h-6 opacity-60" />
        </div>

        {/* Wyloguj się Button */}
        <div className="pt-4">
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="destructive"
            className="w-full h-14 rounded-2xl text-base font-barlow font-medium shadow-lg"
          >
            {isSigningOut ? 'Wylogowywanie...' : 'Wyloguj się'}
          </Button>
        </div>
      </div>
    </div>
  );
}
