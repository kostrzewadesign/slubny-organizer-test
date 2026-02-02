import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, PencilSimple, CaretDown } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BudgetSummaryCard } from '@/components/ui/budget-summary-card';
import { BudgetEditModal } from '@/components/ui/budget-edit-modal';
import { ExpenseItem } from '@/components/ui/expense-item';
import { UnifiedActionModal } from '@/components/ui/unified-action-modal';
import { CategoryEditModal } from '@/components/ui/category-edit-modal';
import { ExpenseEditModal } from '@/components/ui/expense-edit-modal';
import { ExpenseDeleteConfirm } from '@/components/ui/expense-delete-confirm';
import { BudgetSkeleton } from '@/components/ui/skeleton';
import { CategoryCompletedModal } from '@/components/ui/category-completed-modal';
import { useTask } from '@/context/TaskContext';
import { useToast } from '@/hooks/use-toast';
import { useSetup } from '@/hooks/use-setup';
import { useAuth } from '@/context/AuthContext';
import type { Expense } from '@/context/TaskContext';
import { Link } from 'react-router-dom';
import dividerImage from '@/assets/divider.png';

// Currency formatting utility
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Example amounts for budget tasks
const taskAmounts: Record<string, number> = {
  'b1': 500,
  // Wybór kościoła/urzędu stanu cywilnego
  'b2': 0,
  // Spotkanie z księdzem/urzędnikiem
  'b3': 800,
  // Muzyka w kościele
  'b4': 600,
  // Dekoracje kościoła
  'b5': 3500,
  // Wybór sukni ślubnej
  'b6': 400,
  // Buty ślubne
  'b7': 300,
  // Usługi fryzjerskie
  'b8': 250,
  // Makijaż ślubny
  'b9': 800,
  // Biżuteria i dodatki
  'b10': 1200,
  // Wybór garnituru
  'b11': 300,
  // Koszula i krawat
  'b12': 400,
  // Buty męskie
  'b13': 200,
  // Dodatki męskie
  'b14': 80,
  // Fryzjer dla pana młodego
  'b15': 8000,
  // Rezerwacja sali weselnej
  'b16': 4500,
  // Catering i menu
  'b17': 600,
  // Tort weselny
  'b18': 1200,
  // Alkohol na wesele
  'b19': 2000,
  // Zespół muzyczny/DJ
  'b20': 1500 // Fotograf na wesele
};
export default function Budget() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    expenses,
    totalBudget,
    spent,
    remaining,
    spentPct,
    remainingPct,
    paidAmount,
    depositAmount,
    toggleExpense,
    updateTotalBudget,
    editExpense,
    deleteExpense,
    loading,
    initDefaultExpenses,
    resetExpensesToDefault
  } = useTask();
  const {
    getUserProfile
  } = useSetup();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  // Add error state
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // State for expense editing
  const [showExpenseActionSheet, setShowExpenseActionSheet] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // State for category editing
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // State for filtering expenses
  const [activeFilter, setActiveFilter] = useState<'all' | 'paid' | 'deposits' | 'unpaid' | 'remaining'>('all');

  // State for category completion modal
  const [completedCategoryModal, setCompletedCategoryModal] = useState<{
    isOpen: boolean;
    categoryName: string;
  }>({ isOpen: false, categoryName: '' });

  // Track previous category states to detect when a category becomes complete
  const previousCategoryStatesRef = useRef<Record<string, boolean>>({});

  // Diagnostyczne logi stanu ładowania - removed to reduce console noise
  // useEffect(() => {
  //   console.log('[Budget] Loading state changed:', { ... });
  // }, [loading, expenses.length, totalBudget]);

  // Filter expenses based on active filter - memoized for performance
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      switch (activeFilter) {
        case 'paid':
          return expense.paymentStatus === 'paid';
        case 'deposits':
          return expense.isDeposit;
        case 'unpaid':
          return expense.paymentStatus === 'none';
        case 'remaining':
          return expense.paymentStatus === 'none';
        default:
          return true;
      }
    });
  }, [expenses, activeFilter]);

  // Group filtered expenses by category - memoized for performance
  const expensesByCategory = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = [];
      }
      acc[expense.category].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);
  }, [filteredExpenses]);

  // Separate categories into active and completed based on payment status
  const { activeCategories, completedCategories } = useMemo(() => {
    const active: Record<string, Expense[]> = {};
    const completed: Record<string, Expense[]> = {};

    Object.entries(expensesByCategory).forEach(([category, expenseList]) => {
      const allPaid = expenseList.every(expense => expense.paymentStatus === 'paid');
      if (allPaid && expenseList.length > 0) {
        completed[category] = expenseList;
      } else {
        active[category] = expenseList;
      }
    });

    return { activeCategories: active, completedCategories: completed };
  }, [expensesByCategory]);

  // Detect when a category transitions from incomplete to complete
  useEffect(() => {
    Object.entries(expensesByCategory).forEach(([category, expenseList]) => {
      const allPaid = expenseList.every(expense => expense.paymentStatus === 'paid');
      const wasAllPaid = previousCategoryStatesRef.current[category];

      // If category just became complete (wasn't complete before, is complete now)
      if (allPaid && expenseList.length > 0 && wasAllPaid === false) {
        setCompletedCategoryModal({ isOpen: true, categoryName: category });
      }

      // Update the tracking ref
      previousCategoryStatesRef.current[category] = allPaid && expenseList.length > 0;
    });
  }, [expensesByCategory]);

  // Scroll to expense after edit
  useEffect(() => {
    const scrollToId = location.state?.scrollToId;
    if (scrollToId && expenses.length > 0) {
      // Find the expense and its category
      const expense = expenses.find(e => e.id === scrollToId);
      
      if (expense) {
        // Open the accordion section if not already open
        setExpandedSections(prev => {
          if (!prev.includes(expense.category)) {
            const newSections = [...prev, expense.category];
            localStorage.setItem('budget-expanded-sections', JSON.stringify(newSections));
            return newSections;
          }
          return prev;
        });
        
        // Wait for DOM to render and scroll
        setTimeout(() => {
          const element = document.getElementById(`expense-${scrollToId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-flash');
            setTimeout(() => element.classList.remove('highlight-flash'), 2000);
          }
        }, 150);
      }
      
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, expenses]);

  // Set default expanded section on first load
  useEffect(() => {
    const saved = localStorage.getItem('budget-expanded-sections');
    if (saved) {
      setExpandedSections(JSON.parse(saved));
    } else {
      // Default to only "Formalności i dokumenty" expanded on first visit
      const categories = Object.keys(expensesByCategory);
      const defaultCategory = categories.includes('Formalności i dokumenty') ? ['Formalności i dokumenty'] : categories.slice(0, 1); // First category if "Formalności i dokumenty" doesn't exist
      setExpandedSections(defaultCategory);
    }
  }, [expensesByCategory]);
  const handleAccordionChange = (values: string[]) => {
    setExpandedSections(values);
    localStorage.setItem('budget-expanded-sections', JSON.stringify(values));
  };

  // Handle segment click for filtering - optimized with useCallback
  const handleSegmentClick = useCallback((filter: 'all' | 'paid' | 'deposits' | 'unpaid' | 'remaining') => {
    setActiveFilter(filter);
    setShowExpenseActionSheet(null);

    // Scroll to expenses section
    const expensesSection = document.querySelector('[data-expenses-section]');
    if (expensesSection) {
      expensesSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }, []);

  // Category editing handlers
  const handleCategoryClick = useCallback((category: string) => {
    setEditingCategory(category);
  }, []);
  const handleCategoryEdit = useCallback((oldName: string, newName: string) => {
    // TODO: [backend] Implement category renaming logic
    setEditingCategory(null);
  }, [toast]);

  // Expense editing handlers - optimized with useCallback
  const handleToggleExpense = useCallback(async (id: string) => {
    try {
      const expense = expenses.find(e => e.id === id);
      const willBeCompleted = expense ? expense.paymentStatus === 'none' : false;
      await toggleExpense(id);
    } catch (error) {
      console.error('Budget: Failed to toggle expense:', error);
      
      // Dedykowany komunikat dla walidacji kwoty
      if (error instanceof Error && error.message === 'VALIDATION_AMOUNT_REQUIRED') {
        toast({
          title: "Brak kwoty",
          description: "Wprowadź kwotę wydatku przed oznaczeniem go jako opłaconego",
          variant: "destructive",
          duration: 4000
        });
        return;
      }
      
      // Ogólny komunikat błędu
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu wydatku",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [toggleExpense, toast, expenses]);
  const handleEditExpense = useCallback(async (updates: Partial<Expense>) => {
    if (!editingExpense) return;
    try {
      editExpense(editingExpense.id, updates);
      setEditingExpense(null);
    } catch (error) {
      console.error('Budget: Failed to edit expense:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować wydatku",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [editingExpense, editExpense, toast]);
  const handleDeleteExpense = useCallback(async () => {
    if (!deletingExpense) return;
    try {
      deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    } catch (error) {
      console.error('Budget: Failed to delete expense:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć wydatku",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [deletingExpense, deleteExpense, toast]);

  // Show error state (priority 1 - must be checked before loading)
  if (error) {
    console.log(`[Budget] ${new Date().toISOString()} - Error state displayed:`, error);
    return <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-destructive font-barlow mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      </div>;
  }

  // Show loading state (priority 2 - checked after error)
  if (loading) {
    return <div className="min-h-screen bg-white relative overflow-hidden">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-primary/20 rounded-full mx-auto mb-4"></div>
            </div>
            <p className="text-muted-foreground font-barlow mb-4">Ładowanie budżetu...</p>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log(`[Budget] ${new Date().toISOString()} - Manual reload triggered`);
                window.location.reload();
              }}
              className="mt-2"
            >
              Spróbuj ponownie
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none animate-float" style={{
        backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`
      }} />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95">
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <div className="flex gap-2">
            {expenses.length > 0}
            <Link to="/budget/new" className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95">
              <Plus size={24} weight="light" color="#FFFFFF" />
            </Link>
          </div>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3 animate-fade-in">Budżet ślubu</h1>
          <p className="text-muted-foreground font-barlow text-lg animate-fade-in">Zarządzajcie finansami wesela</p>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none" style={{
        backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`
      }} />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link to="/dashboard" className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm">
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <Link to="/budget/new" className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm">
            <Plus size={24} weight="light" color="#FFFFFF" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Budżet ślubu</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zarządzajcie finansami wesela</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 space-y-6">

        {/* Budget Summary */}
        <BudgetSummaryCard totalBudget={totalBudget} spent={spent} remaining={remaining} paidAmount={paidAmount} depositAmount={depositAmount} onEditBudget={() => setEditModalOpen(true)} />

        {/* Empty state for expenses */}
        {!loading && expenses.length === 0 && <Card className="shadow-card">
            <CardContent className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-cormorant font-semibold mb-2">Brak wydatków w budżecie</h3>
                <p className="text-muted-foreground font-barlow mb-4">
                  Załaduj domyślne kategorie wydatków lub dodaj własne pozycje do budżetu.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={async () => {
                await initDefaultExpenses();
              }} className="font-barlow">
                    Załaduj domyślne wydatki
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/budget/new')} className="font-barlow">
                    Dodaj własny wydatek
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Budget Expenses */}
        <div data-expenses-section>
          {/* Filter indicator */}
          {activeFilter !== 'all' && <div className="mb-4 flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-barlow font-medium text-primary">
                  Filtr aktywny: {activeFilter === 'paid' ? 'Zapłacone' : activeFilter === 'deposits' ? 'Zaliczki' : activeFilter === 'unpaid' ? 'Do zapłaty' : activeFilter === 'remaining' ? 'Pozostałe' : 'Wszystkie'}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({filteredExpenses.length} z {expenses.length})
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveFilter('all')} className="h-7 px-2 text-xs text-muted-foreground hover:text-primary">
                Wyczyść
              </Button>
            </div>}

          {/* Active categories */}
          <Accordion type="multiple" value={expandedSections} onValueChange={handleAccordionChange} className="space-y-6">
          {Object.keys(expensesByCategory).length === 0 ? <div className="text-center py-12">
              <p className="text-muted-foreground font-barlow">
                {activeFilter === 'all' ? 'Brak wydatków w budżecie' : 'Brak wydatków w wybranym filtrze'}
              </p>
              {activeFilter !== 'all' && <button onClick={() => handleSegmentClick('all')} className="text-primary underline mt-2 font-barlow text-sm">
                  Pokaż wszystkie wydatki
                </button>}
            </div> : Object.entries(activeCategories).map(([category, expenseList]) => {
            const completedCount = expenseList.filter(expense => expense.paymentStatus === 'paid').length;
            const totalCount = expenseList.length;
            const categoryTotal = expenseList.reduce((sum, expense) => sum + expense.amount, 0);
            return <AccordionItem key={category} value={category} className="border-none">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden" aria-label={`Kategoria ${category}, ${totalCount} wydatków`}>
                   <div className="flex items-center justify-between w-full pr-4 mt-4">
                     <h3 
                       className={`text-xl font-cormorant font-semibold text-left transition-colors duration-200 break-words leading-tight ${completedCount === totalCount ? 'text-success' : 'text-[#1E1E1E]'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryClick(category);
                        }}
                     >
                       {category}
                     </h3>
                     <div className="flex items-center space-x-3">
                       <div className="flex flex-col items-end space-y-1">
                         <span className={`text-sm font-barlow transition-colors duration-200 ${completedCount === totalCount ? 'text-success' : 'text-muted-foreground'}`}>
                           {completedCount}/{totalCount}
                         </span>
                         <span className="text-xs font-barlow text-muted-foreground">
                           {categoryTotal.toLocaleString('pl-PL')} zł
                         </span>
                       </div>
                       <CaretDown size={20} weight="light" className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </div>
                   </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-3 pb-0 px-0" role="region" aria-label={`Wydatki w kategorii ${category}`}>
                  {expenseList.length === 0 ? <p className="text-muted-foreground text-sm font-barlow py-2">
                      Brak wydatków w tej kategorii
                    </p> : <div className="space-y-3">
                       {expenseList.map(expense => <ExpenseItem key={expense.id} expense={expense} onToggle={() => handleToggleExpense(expense.id)} formatCurrency={formatCurrency} />)}
                    </div>}
                  
                  {/* Add expense button for this category */}
                  <div className="mt-4">
                    <Link to={`/budget/new?category=${encodeURIComponent(category)}`}>
                      <Card className="cursor-pointer transition-all duration-200 !shadow-none !border-0 border-transparent bg-transparent">
                        <CardContent className="p-2">
                          <div className="flex items-center justify-center space-x-2 text-primary">
                            <Plus size={18} weight="light" />
                            <span className="font-barlow text-sm">
                              Dodaj wydatek
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>;
          })}
          </Accordion>

          {/* Divider and Completed Expenses Section */}
          <div className="mt-8 mb-6">
            <img 
              src={dividerImage}
              alt="" 
              className="w-full h-auto mx-auto max-w-md opacity-50"
            />
          </div>

          <div className="mb-4">
            <h2 className="text-2xl font-cormorant font-bold text-[#1E1E1E] text-center">
              Opłacone wydatki
            </h2>
          </div>

          {/* Completed categories */}
          <Accordion type="multiple" value={expandedSections} onValueChange={handleAccordionChange} className="space-y-6">
          {Object.entries(completedCategories).map(([category, expenseList]) => {
            const completedCount = expenseList.filter(expense => expense.paymentStatus === 'paid').length;
            const totalCount = expenseList.length;
            const categoryTotal = expenseList.reduce((sum, expense) => sum + expense.amount, 0);
            return <AccordionItem key={category} value={category} className="border-none">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden" aria-label={`Kategoria ${category}, ${totalCount} wydatków`}>
                   <div className="flex items-center justify-between w-full pr-4 mt-4">
                     <h3 
                       className="text-xl font-cormorant font-semibold text-left transition-colors duration-200 break-words leading-tight text-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCategoryClick(category);
                        }}
                     >
                       {category}
                     </h3>
                     <div className="flex items-center space-x-3">
                       <div className="flex flex-col items-end space-y-1">
                         <span className="text-sm font-barlow transition-colors duration-200 text-success">
                           {completedCount}/{totalCount}
                         </span>
                         <span className="text-xs font-barlow text-muted-foreground">
                           {categoryTotal.toLocaleString('pl-PL')} zł
                         </span>
                       </div>
                       <CaretDown size={20} weight="light" className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                     </div>
                   </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-3 pb-0 px-0" role="region" aria-label={`Wydatki w kategorii ${category}`}>
                  <div className="space-y-3">
                    {expenseList.map(expense => <ExpenseItem key={expense.id} expense={expense} onToggle={() => handleToggleExpense(expense.id)} formatCurrency={formatCurrency} />)}
                  </div>
                  
                  {/* Add expense button for this category */}
                  <div className="mt-4">
                    <Link to={`/budget/new?category=${encodeURIComponent(category)}`}>
                      <Card className="cursor-pointer transition-all duration-200 !shadow-none !border-0 border-transparent bg-transparent">
                        <CardContent className="p-2">
                          <div className="flex items-center justify-center space-x-2 text-primary">
                            <Plus size={18} weight="light" />
                            <span className="font-barlow text-sm">
                              Dodaj wydatek
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>;
          })}
          </Accordion>
        </div>
      </div>

      <BudgetEditModal open={editModalOpen} onOpenChange={setEditModalOpen} currentBudget={totalBudget} />

      {/* Expense Action Sheet */}
      <UnifiedActionModal isOpen={!!showExpenseActionSheet} onClose={() => setShowExpenseActionSheet(null)} onEdit={() => {
      const expense = expenses.find(e => e.id === showExpenseActionSheet);
      if (expense) setEditingExpense(expense);
    }} onDelete={() => {
      const expense = expenses.find(e => e.id === showExpenseActionSheet);
      if (expense) setDeletingExpense(expense);
    }} title={expenses.find(e => e.id === showExpenseActionSheet)?.title || ''} subtitle={expenses.find(e => e.id === showExpenseActionSheet) ? formatCurrency(expenses.find(e => e.id === showExpenseActionSheet)!.amount) : ''} />

      {/* Category Edit Modal */}
      <CategoryEditModal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} onSave={newName => editingCategory && handleCategoryEdit(editingCategory, newName)} currentName={editingCategory || ''} title="Edytuj kategorię" />

      {/* Expense Edit Modal */}
      <ExpenseEditModal isOpen={!!editingExpense} onClose={() => setEditingExpense(null)} onSave={handleEditExpense} expense={editingExpense} />

      {/* Expense Delete Confirm */}
      <ExpenseDeleteConfirm isOpen={!!deletingExpense} onClose={() => setDeletingExpense(null)} onConfirm={handleDeleteExpense} expenseTitle={deletingExpense?.title || ''} />

      {/* Category Completed Modal */}
      <CategoryCompletedModal 
        isOpen={completedCategoryModal.isOpen}
        onClose={() => setCompletedCategoryModal({ isOpen: false, categoryName: '' })}
        categoryName={completedCategoryModal.categoryName}
        context="budget"
      />
    </div>;
}