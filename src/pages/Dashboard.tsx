
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReadinessChart } from '@/components/ui/readiness-chart';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, CheckSquare, DollarSign, Users, Calendar, Heart, TrendingUp } from 'lucide-react';
import { List } from '@phosphor-icons/react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale/pl';
import { Link } from 'react-router-dom';
import botanicalPlaceholder from '@/assets/botanical-placeholder.svg';
import divider from '@/assets/divider.png';
import logo from '@/assets/logo.png';
import { useTask } from '@/context/TaskContext';
import { useGuests } from '@/context/GuestContext';
import { useTables } from '@/context/TableContext';
import { useSetup } from '@/hooks/use-setup';
import { useAuth } from '@/context/AuthContext';
import { SetupModal } from '@/components/ui/setup-modal';
import { WelcomeModal } from '@/components/ui/welcome-modal';
import { supabase } from '@/integrations/supabase/client';

interface DashboardProps {
  onMenuToggle?: () => void
}

export default function Dashboard({ onMenuToggle }: DashboardProps) {
  const [weddingInfo, setWeddingInfo] = useState({
    brideName: "Panna młoda",
    groomName: "Pan młody", 
    daysLeft: 0,
    weddingDate: "Data ślubu",
    weddingLocation: "Miejscowość"
  });

  // Get real data from contexts with error handling
  const taskContext = useTask();
  const guestContext = useGuests();
  const tableContext = useTables();
  const { getUserProfile } = useSetup();
  const { user, loading: authLoading } = useAuth();

  // Safe destructuring with fallbacks
  const { tasks = [], expenses = [], spent = 0, totalBudget = 50000, spentPct = 0 } = taskContext || {};
  const { totalInvited = 0, attendingGuestsCount = 0, confirmedCount = 0, guests = [] } = guestContext || {};
  const { getAssignedGuestsCount } = tableContext || {};

  // Calculate days left to wedding
  const calculateDaysLeft = (weddingDate: string): number => {
    const today = new Date();
    const wedding = new Date(weddingDate);
    const diffTime = wedding.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Format wedding date for display
  const formatWeddingDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, 'd MMMM yyyy', { locale: pl });
    } catch (error) {
      return dateString;
    }
  };

  // Load wedding info from Supabase using react-query for automatic refresh
  const { data: profile, error: profileError, isLoading: profileLoading, isFetching: profileFetching } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      console.log('🔵 [Dashboard] useQuery queryFn called, user:', user?.id);
      const result = await getUserProfile();
      console.log('🔵 [Dashboard] useQuery queryFn result:', result);
      return result;
    },
    enabled: !!user && !authLoading,
    staleTime: 5000,
    retry: 2,
  });

  // Debug logging - minimal version
  console.log('🔵 [Dashboard] State:', {
    hasProfile: !!profile,
    profileLoading,
    user: user?.id?.slice(0, 8) + '...',
    authLoading,
    enabled: !!user && !authLoading
  });

  // Update wedding info when profile changes
  useEffect(() => {
    console.log('📊 Dashboard profile update:', { profile, user: user?.id });
    if (profile) {
      setWeddingInfo({
        brideName: profile.brideFirstName || "",
        groomName: profile.groomFirstName || "",
        daysLeft: profile.weddingDate ? calculateDaysLeft(profile.weddingDate) : 0,
        weddingDate: profile.weddingDate ? formatWeddingDate(profile.weddingDate) : "Data ślubu",
        weddingLocation: profile.location || "Miejscowość"
      });
    }
  }, [profile, user]);

  const { brideName, groomName, daysLeft, weddingDate, weddingLocation } = weddingInfo;

  // Memoized calculations for performance
  const progressData = useMemo(() => {
    // Calculate real progress data with safe guards
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    
    // Calculate expense organizational progress
    const paidExpenses = expenses.filter(expense => 
      expense.paymentStatus === 'paid'
    ).length;
    const totalExpenses = expenses.length;
    const expenseCompletionPct = totalExpenses > 0 ? 
      Math.min(Math.round((paidExpenses / totalExpenses) * 100), 100) : 0;
    
    // Count confirmed guests only (remove 'attending' as it's not in current enum)
    const eligibleForSeatingGuests = guests.filter(guest => 
      guest.rsvpStatus === 'confirmed'
    );
    // Use TableContext for accurate assignment count
    const assignedGuests = getAssignedGuestsCount ? getAssignedGuestsCount() : 0;

    // Use guest count from setup (couple already included)
    const targetGuestCount = profile?.guestCount 
      ? profile.guestCount  // Use as-is, couple already included
      : totalInvited;  // Fallback to current guest count if no profile

    // Calculate percentages with zero-division protection and cap at 100%
    const tasksCompletionPct = totalTasks > 0 ? Math.min(Math.round((completedTasks / totalTasks) * 100), 100) : 0;
    const guestsConfirmationPct = targetGuestCount > 0 ? Math.min(Math.round((confirmedCount / targetGuestCount) * 100), 100) : 0;
    
    // FIXED: Seating calculation based on eligible guests
    const seatingCompletionPct = eligibleForSeatingGuests.length > 0 ? 
      Math.min(Math.round((assignedGuests / eligibleForSeatingGuests.length) * 100), 100) : 0;

    // Calculate overall progress as average of all sections
    const overallProgress = Math.round((tasksCompletionPct + expenseCompletionPct + guestsConfirmationPct + seatingCompletionPct) / 4);

    return {
      completedTasks,
      totalTasks,
      tasksCompletionPct,
      paidExpenses,
      totalExpenses,
      expenseCompletionPct,
      guestsConfirmationPct,
      seatingCompletionPct,
      overallProgress,
      assignedGuests,
      eligibleForSeatingCount: eligibleForSeatingGuests.length,
      targetGuestCount
    };
  }, [tasks, expenses, totalInvited, confirmedCount, guests, attendingGuestsCount, profile]);

  const {
    completedTasks,
    totalTasks,
    tasksCompletionPct,
    paidExpenses,
    totalExpenses,
    expenseCompletionPct,
    guestsConfirmationPct,
    seatingCompletionPct,
    overallProgress,
    assignedGuests,
    eligibleForSeatingCount,
    targetGuestCount
  } = progressData;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <WelcomeModal />
      <SetupModal />

      {/* Top botanical background image */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none opacity-60 animate-float" style={{
      backgroundImage: `url(/lovable-uploads/af67601b-5c69-4ab3-abf8-0f2fce1af14a.png)`
    }} />
      
      {/* Botanical background illustration - subtle and elegant */}
      <div className="absolute inset-0 opacity-10 bg-no-repeat bg-center bg-contain pointer-events-none" style={{
      backgroundImage: `url(${botanicalPlaceholder})`,
      backgroundSize: 'auto 80%',
      backgroundPosition: 'center 20%'
    }} />
      
      <div className="relative z-10 p-4 pb-24">
        
        {/* Navigation icons - same position as /tasks */}
        <div className="flex items-center justify-between mb-4">
          <img src={logo} alt="Ślubny Organizer" className="h-6 animate-float" />
          <Link
            to="/menu"
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg md:hidden transition-colors transition-transform duration-200 active:scale-95"
            aria-label="Otwórz menu"
          >
            <List size={24} weight="light" className="text-white" />
          </Link>
        </div>

        {/* Hero Section matching HOME.png layout */}
        <div className="text-center py-8 px-4 relative">
          
          {/* Botanical decoration behind names */}
          <div className="absolute inset-0 opacity-15 bg-no-repeat bg-center pointer-events-none" style={{
          backgroundImage: `url(/lovable-uploads/116f4b31-81a8-417a-8f94-2be6df0902f9.png)`,
          backgroundSize: 'contain',
          backgroundPosition: 'center'
        }} />
          
          {/* Couple Names exactly like HOME.png */}
          <div className="mb-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-cormorant font-bold text-[#1E1E1E] leading-tight animate-fade-in">
              {brideName}
            </h2>
            <div className="text-xl font-cormorant text-primary my-2 animate-fade-in">&</div>
            <h2 className="text-4xl md:text-5xl font-cormorant font-bold text-[#1E1E1E] leading-tight animate-fade-in">
              {groomName}
            </h2>
          </div>

          {/* Days Counter exactly like HOME.png */}
          <div className="mb-8 relative z-10">
            <div className="text-8xl md:text-9xl font-cormorant font-bold text-primary mb-2">
              {daysLeft}
            </div>
            <div className="text-lg font-cormorant font-bold text-[#1E1E1E] uppercase tracking-wider">
              DNI
            </div>
          </div>

          {/* Wedding Details exactly like HOME.png */}
          <div className="relative z-10">
            <h3 className="text-2xl font-cormorant font-bold text-[#1E1E1E] mb-4">
              Do Naszego Ślubu
            </h3>
            <div className="space-y-1">
              <p className="text-base font-barlow text-primary">{weddingDate}</p>
              <p className="text-sm font-barlow text-gray-600">{weddingLocation}</p>
            </div>
          </div>
        </div>

        {/* Divider before Progress Overview */}
        <div className="flex justify-center my-12">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Progress Overview - Exact match to reference design */}
        <div className="mt-8">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl font-cormorant font-bold text-[#1E1E1E]">
              Wasze postępy
            </h2>
          </div>
          
          <div className="space-y-8">
            {/* Checklista Card */}
            <Card className="bg-white rounded-2xl shadow-card p-6 border-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-cormorant font-bold text-[#1E1E1E]">Zadania</h3>
                <div className="text-right">
                  <div className="text-lg font-barlow text-[#1E1E1E] font-normal">
                    {completedTasks}/{totalTasks}
                  </div>
                  <div className="text-sm text-gray-500 font-barlow">
                    zadań wykonanych
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground font-barlow">Procent ukończenia</div>
                  <div className="text-lg font-barlow text-[#1E1E1E] font-semibold">
                    {tasksCompletionPct}%
                  </div>
                </div>
                <div className="w-full bg-[hsl(73_51%_94%)] rounded-full h-3">
                  <div className="bg-[#A3B368] h-3 rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${tasksCompletionPct}%`
                }}></div>
                </div>
              </div>
            </Card>

            {/* Budżet Card */}
            <Card className="bg-white rounded-2xl shadow-card p-6 border-0 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-cormorant font-bold text-[#1E1E1E]">Budżet</h3>
                <div className="text-right">
                  <div className="text-lg font-barlow text-[#1E1E1E] font-normal">
                    {paidExpenses}/{totalExpenses}
                  </div>
                  <div className="text-sm text-gray-500 font-barlow">
                    wydatków opłaconych
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground font-barlow">Procent ukończenia</div>
                  <div className="text-lg font-barlow text-[#1E1E1E] font-semibold">
                    {expenseCompletionPct}%
                  </div>
                </div>
                <div className="w-full bg-[hsl(73_51%_94%)] rounded-full h-3">
                  <div className="bg-[#A3B368] h-3 rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${expenseCompletionPct}%`
                }}></div>
                </div>
              </div>
            </Card>

            {/* Potwierdzenia gości Card */}
            <Card className="bg-white rounded-2xl shadow-card p-6 border-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-cormorant font-bold text-[#1E1E1E]">Potwierdzenia gości</h3>
                <div className="text-right">
                  <div className="text-lg font-barlow text-[#1E1E1E] font-normal">
                    {confirmedCount}/{targetGuestCount}
                  </div>
                  <div className="text-sm text-gray-500 font-barlow">
                    gości potwierdzonych
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground font-barlow">Procent ukończenia</div>
                  <div className="text-lg font-barlow text-[#1E1E1E] font-semibold">
                    {guestsConfirmationPct}%
                  </div>
                </div>
                <div className="w-full bg-[hsl(73_51%_94%)] rounded-full h-3">
                  <div className="bg-[#A3B368] h-3 rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${guestsConfirmationPct}%`
                }}></div>
                </div>
              </div>
            </Card>

            {/* Rozmieszczenie gości Card */}
            <Card className="bg-white rounded-2xl shadow-card p-6 border-0 animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-cormorant font-bold text-[#1E1E1E]">Rozmieszczenie gości</h3>
                  <div className="text-right">
                  <div className="text-lg font-barlow text-[#1E1E1E] font-normal">
                    {assignedGuests}/{eligibleForSeatingCount}
                  </div>
                  <div className="text-sm text-gray-500 font-barlow">
                    gości przypisanych
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground font-barlow">Procent ukończenia</div>
                  <div className="text-lg font-barlow text-[#1E1E1E] font-semibold">
                    {seatingCompletionPct}%
                  </div>
                </div>
                <div className="w-full bg-[hsl(73_51%_94%)] rounded-full h-3">
                  <div className="bg-[#A3B368] h-3 rounded-full transition-all duration-1000 ease-out" style={{
                  width: `${seatingCompletionPct}%`
                }}></div>
                </div>
              </div>
            </Card>

            {/* Overall Progress Chart */}
            <ReadinessChart 
              progress={overallProgress} 
              className="mt-12"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
