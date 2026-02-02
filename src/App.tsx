import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { TaskProvider } from "@/context/TaskContext";
import { GuestProvider } from "@/context/GuestContext";
import { TableProvider } from "@/context/TableContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
// Removed SetupRedirect - using soft modal approach now
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { EnhancedGuestSecurity } from "@/components/security/EnhancedGuestSecurity";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import Onboarding from "./pages/Onboarding";
import EditExpense from "@/pages/EditExpense";
import Tasks from "./pages/Tasks";
import AddTask from "./pages/AddTask";
import EditTask from "./pages/EditTask";
import Budget from "./pages/Budget";
import AddExpense from "./pages/AddExpense";
import Guests from "./pages/Guests";
import AddGuest from "./pages/AddGuest";
import EditGuest from "./pages/EditGuest";
import EditTable from "./pages/EditTable";

import Seating from "./pages/Seating";
import AddTable from "./pages/AddTable";
import AssignGuestToTable from "./pages/AssignGuestToTable";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import Contact from "./pages/Contact";
import Menu from "./pages/Menu";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

// DEBUG: Database state checker - runs on every page load
const DatabaseDebugger = () => {
  React.useEffect(() => {
    const checkDatabaseState = async () => {
      console.log('🔍 ==================== DATABASE STATE CHECK ====================');
      console.log('🔍 Timestamp:', new Date().toISOString());

      // Check session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔍 Session:', {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id
      });

      if (!sessionData.session?.user?.id) {
        console.log('🔍 No session - skipping database check');
        console.log('🔍 ============================================================');
        return;
      }

      const userId = sessionData.session.user.id;

      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('🔍 Profile:', {
        found: !!profile,
        error: profileError?.message,
        data: profile ? {
          bride_first_name: profile.bride_first_name,
          groom_first_name: profile.groom_first_name,
          setup_completed: profile.setup_completed,
          has_completed_onboarding: profile.has_completed_onboarding
        } : null
      });

      // Check guests count
      const { data: guests, error: guestsError } = await supabase
        .from('guests')
        .select('id, first_name, last_name, role')
        .eq('user_id', userId);

      console.log('🔍 Guests:', {
        count: guests?.length || 0,
        error: guestsError?.message,
        data: guests?.map(g => `${g.first_name} ${g.last_name} (${g.role})`)
      });

      // Check tables
      const { data: tables, error: tablesError } = await supabase
        .from('tables')
        .select('id, name')
        .eq('user_id', userId);

      console.log('🔍 Tables:', {
        count: tables?.length || 0,
        error: tablesError?.message,
        data: tables?.map(t => t.name)
      });

      // Check tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', userId);

      console.log('🔍 Tasks count:', tasks?.length || 0, tasksError?.message || '');

      // Check expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', userId);

      console.log('🔍 Expenses count:', expenses?.length || 0, expensesError?.message || '');

      console.log('🔍 ============================================================');
    };

    checkDatabaseState();
  }, []);

  return null;
};

// Protected Route Component with improved loading UI
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-barlow">Ładowanie...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component - allows unauthenticated access
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Auth.tsx will handle redirection for authenticated users
  // This component just renders children (auth page)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-barlow">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DatabaseDebugger />
        <SecurityHeaders />
        <EnhancedGuestSecurity>
          <TaskProvider>
            <GuestProvider>
              <TableProvider>
              <Toaster />
              <Sonner position="bottom-right" />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={
                    <PublicRoute>
                      <Auth />
                    </PublicRoute>
                  } />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Onboarding page - direct access */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } />
                  
                  {/* Setup page - direct access */}
                  <Route path="/setup" element={
                    <ProtectedRoute>
                      <Setup />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/" element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="tasks/new" element={<AddTask />} />
                    <Route path="tasks/edit/:taskId" element={<EditTask />} />
              <Route path="budget" element={<Budget />} />
              <Route path="budget/new" element={<AddExpense />} />
              <Route path="budget/edit/:expenseId" element={<EditExpense />} />
                    <Route path="guests" element={<Guests />} />
                    <Route path="guests/new" element={<AddGuest />} />
                    <Route path="guests/edit/:guestId" element={<EditGuest />} />
                    
                    <Route path="seating" element={<Seating />} />
          <Route path="seating/new" element={<AddTable />} />
          <Route path="seating/edit/:tableId" element={<EditTable />} />
          <Route path="seating/assign/:guestId" element={<AssignGuestToTable />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="payment-success" element={<PaymentSuccess />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="menu" element={<Menu />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </TableProvider>
            </GuestProvider>
          </TaskProvider>
        </EnhancedGuestSecurity>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
