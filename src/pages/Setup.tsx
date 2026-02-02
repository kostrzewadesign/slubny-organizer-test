import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/hooks/use-toast';
import { useSetup } from '@/hooks/use-setup';
import { useTask } from '@/context/TaskContext';
import { useGuests } from '@/context/GuestContext';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar } from '@phosphor-icons/react';
import dividerImage from '@/assets/divider.png';
export default function Setup() {
  const {
    saveSetupData,
    loading,
    getUserProfile,
    isSetupComplete
  } = useSetup();
  const { refreshBudget } = useTask();
  const { reloadGuests } = useGuests();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({
    brideFirstName: '',
    groomFirstName: '',
    weddingDate: undefined as Date | undefined,
    location: '',
    budget: '',
    guestCount: ''
  });

  // Check if setup is already complete and load existing data
  useEffect(() => {
    const checkAndLoadProfile = async () => {
      console.log('🔵 [Setup] Checking if setup is already complete...');
      console.log('🔍 [Setup] isSetupComplete:', isSetupComplete);

      // If setup is already complete, redirect to dashboard
      if (isSetupComplete === true) {
        console.log('🚀 [Setup] Setup already complete, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
        return;
      }

      // Load existing profile data if any
      try {
        const profile = await getUserProfile();
        console.log('🔍 [Setup] Loaded profile:', profile);

        if (profile) {
          setFormData({
            brideFirstName: profile.brideFirstName || '',
            groomFirstName: profile.groomFirstName || '',
            weddingDate: profile.weddingDate ? new Date(profile.weddingDate) : undefined,
            location: profile.location || '',
            budget: profile.totalBudget ? profile.totalBudget.toString() : '',
            guestCount: profile.guestCount ? profile.guestCount.toString() : ''
          });
          console.log('✅ [Setup] Form data populated from profile');
        }
      } catch (error) {
        console.error('❌ [Setup] Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    checkAndLoadProfile();
  }, [isSetupComplete, getUserProfile, navigate]);

  const handleInputChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.brideFirstName || !formData.groomFirstName || !formData.weddingDate || !formData.location || !formData.budget || !formData.guestCount) {
      toast({
        title: "Błąd walidacji",
        description: "Proszę wypełnić wszystkie wymagane pola",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      console.log('🔄 [Setup] Starting setup data save...');

      // Save names exactly as user entered them (no splitting)
      const setupResult = await saveSetupData({
        brideFirstName: formData.brideFirstName.trim(),
        brideLastName: '',  // Empty - everything goes into firstName
        groomFirstName: formData.groomFirstName.trim(),
        groomLastName: '',  // Empty - everything goes into firstName
        weddingDate: formData.weddingDate ? formData.weddingDate.toISOString().split('T')[0] : '',
        location: formData.location,
        budget: formData.budget,
        guestCount: formData.guestCount,
        notes: ''
      });
      console.log('✅ [Setup] Data saved successfully, result:', setupResult);

      // Refresh budget and guests in contexts to load the new values
      console.log('🔄 [Setup] Refreshing contexts...');
      await refreshBudget();
      console.log('✅ [Setup] Budget refreshed in TaskContext');

      await reloadGuests();
      console.log('✅ [Setup] Guests refreshed in GuestContext');

      // Invalidate related queries
      console.log('🔄 [Setup] Invalidating query caches...');
      queryClient.invalidateQueries({
        queryKey: ['userProfile']
      });
      queryClient.invalidateQueries({
        queryKey: ['guests']
      });
      queryClient.invalidateQueries({
        queryKey: ['tables']
      });
      queryClient.invalidateQueries({
        queryKey: ['seating']
      });
      console.log('✅ [Setup] Query caches invalidated');

      // Navigate to dashboard
      console.log('🚀 [Setup] Navigating to /dashboard');
      navigate('/dashboard', {
        replace: true
      });
    } catch (error: any) {
      console.error('❌ Setup: Error saving data:', error);
      toast({
        title: "Błąd podczas zapisywania",
        description: error?.message || "Wystąpił problem podczas zapisywania danych. Spróbujcie ponownie.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Show loading state while checking profile
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-barlow">Ładowanie profilu...</p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Botanical background - same as Tasks */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none" style={{
      backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`
    }} />

      {/* Back button */}
      <div className="relative z-10 p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="w-10 h-10 bg-primary rounded-lg hover:bg-primary-dark">
          <ArrowLeft className="h-6 w-6 text-white" weight="light" />
        </Button>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-lg mx-auto px-6 pt-4 pb-12">
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E]">
            Zaczynamy!
          </h1>
          <p className="text-muted-foreground font-barlow text-base leading-relaxed px-2">
            Podzielcie się kilkoma informacjami o Waszym ślubie – dzięki temu przygotujemy plan dopasowany specjalnie do Was.
          </p>
        </div>

        {/* Decorative divider */}
        <div className="flex justify-center mb-8">
          <img src={dividerImage} alt="" className="w-48 h-auto opacity-80" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Para Młoda Section */}
          <div className="space-y-5">
            <h2 className="text-3xl font-cormorant font-semibold text-center text-[#1E1E1E]">
              Para Młoda
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brideFirstName" className="text-neutral font-barlow text-sm">
                  Imię Panny Młodej*
                </Label>
                <Input id="brideFirstName" placeholder="np. Kamila" value={formData.brideFirstName} onChange={e => handleInputChange('brideFirstName', e.target.value)} required className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groomFirstName" className="text-neutral font-barlow text-sm">
                  Imię Pana Młodego*
                </Label>
                <Input id="groomFirstName" placeholder="np. Robert" value={formData.groomFirstName} onChange={e => handleInputChange('groomFirstName', e.target.value)} required className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow" />
              </div>
            </div>
          </div>

          {/* Szczegóły ślubu Section */}
          <div className="space-y-5 pt-2">
            {/* Decorative divider */}
            <div className="flex justify-center mb-2">
              <img src={dividerImage} alt="" className="w-48 h-auto opacity-80" />
            </div>
            
            <h2 className="text-3xl font-cormorant font-semibold text-center text-[#1E1E1E]">
              Szczegóły ślubu
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="weddingDate" className="text-neutral font-barlow text-sm">
                  Data ślubu *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted z-10 pointer-events-none" weight="light" />
                <DatePicker date={formData.weddingDate} onSelect={date => handleInputChange('weddingDate', date)} placeholder="Wybierz datę ślubu" className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white pl-12 text-base font-barlow" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-neutral font-barlow text-sm">
                  Miejscowość*
                </Label>
                <Input id="location" placeholder="np. Warszawa" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} required className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-neutral font-barlow text-sm">
                  Budżet*
                </Label>
                <Input id="budget" type="number" placeholder="np. 50000" value={formData.budget} onChange={e => handleInputChange('budget', e.target.value)} required className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestCount" className="text-neutral font-barlow text-sm">
                  Ilość Gości*
                </Label>
                <Input id="guestCount" type="number" placeholder="np. 120" value={formData.guestCount} onChange={e => handleInputChange('guestCount', e.target.value)} required className="h-14 rounded-2xl border-primary/30 focus:border-primary bg-white text-base font-barlow" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" size="lg" disabled={isSubmitting || loading} className="w-full h-14 rounded-2xl text-base font-barlow font-medium bg-primary hover:bg-primary-dark text-white shadow-lg">
              {isSubmitting || loading ? 'Zapisywanie...' : 'Rozpocznij planowanie'}
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-center text-sm font-barlow pt-2 text-neutral-400">
            *Dane możesz później zaktualizować w zakładce Ustawienia.
          </p>
        </form>
      </div>
    </div>;
}