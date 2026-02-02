import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ArrowLeft, Check, Plus, X, Trash } from '@phosphor-icons/react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect, useMemo } from 'react'
import { ExpenseDeleteConfirm } from '@/components/ui/expense-delete-confirm'
import { useTask } from '@/context/TaskContext'

const expenseSchema = z.object({
  title: z.string().min(1, "Podaj nazwę wydatku"),
  amount: z.number({
    required_error: "Podaj kwotę",
    invalid_type_error: "Kwota musi być liczbą",
  }).positive("Kwota musi być większa od 0"),
  category: z.string().min(1, "Wybierz kategorię"),
  isDeposit: z.boolean(),
  note: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

// Default categories fallback for new users without expenses
const DEFAULT_CATEGORIES = [
  "Formalności i dokumenty",
  "Strój Panny Młodej",
  "Strój Pana Młodego",
  "Ceremonia",
  "Wesele – lokal i obsługa",
  "Dekoracje i florystyka",
  "Oprawa artystyczna",
  "Foto & Video",
  "Transport i logistyka",
  "Papeteria i dodatki",
  "Podróż poślubna",
  "Rezerwa / nieprzewidziane wydatki"
];

export default function EditExpense() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { expenseId } = useParams<{ expenseId: string }>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { 
    expenses, 
    editExpense,
    deleteExpense, 
    customExpenseCategories, 
    addCustomExpenseCategory,
    uniqueExpenseCategories 
  } = useTask()
  const scrollToId = location.state?.scrollToId
  
  // State for adding new category
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Find the expense to edit
  const expense = expenses.find(e => e.id === expenseId)
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      amount: 0,
      category: "",
      isDeposit: false,
      note: "",
    }
  })

  // Populate form with existing expense data
  useEffect(() => {
    if (expense) {
      form.reset({
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        isDeposit: expense.isDeposit,
        note: expense.note || "",
      })
    }
  }, [expense, form])

  // Handle expense not found
  if (!expenseId || !expense) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground font-barlow mb-4">
              Nie znaleziono wydatku
            </p>
            <Button onClick={() => navigate('/budget')} className="w-full font-barlow">
              Wróć do budżetu
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('EditExpense: Updating expense...', data);
      
      // Validate amount on client side (form validation already handles this)
      
      await editExpense(expenseId, {
        title: data.title,
        amount: data.amount,
        isDeposit: data.isDeposit,
        note: data.note,
      })
      
      console.log('EditExpense: Expense updated successfully, navigating to budget...');
      
      navigate('/budget', { state: { scrollToId } })
    } catch (error) {
      console.error('EditExpense: Failed to update expense:', error);
      
      // Better error message handling
      let errorMessage = "Nie udało się zaktualizować wydatku. Spróbuj ponownie.";
      if (error instanceof Error) {
        if (error.message.includes('violates row-level security')) {
          errorMessage = "Brak uprawnień do edycji wydatku. Sprawdź połączenie z kontem.";
        } else if (error.message.includes('Network Error')) {
          errorMessage = "Błąd połączenia. Sprawdź internetowe i spróbuj ponownie.";
        }
      }
      
      toast({
        title: "Błąd",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/budget', { state: { scrollToId } })
  }

  const handleDelete = () => {
    if (!expenseId) return;
    
    try {
      deleteExpense(expenseId);
      
      navigate('/budget');
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć wydatku. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  // Combine unique categories from expenses with custom categories
  const allCategories = useMemo(() => {
    const baseCategories = uniqueExpenseCategories.length > 0 
      ? uniqueExpenseCategories 
      : DEFAULT_CATEGORIES;
    const combined = [...baseCategories, ...customExpenseCategories];
    return Array.from(new Set(combined)).sort();
  }, [uniqueExpenseCategories, customExpenseCategories]);

  const handleAddNewCategory = (field: any) => {
    const trimmedName = newCategoryName.trim()
    
    if (!trimmedName) {
      toast({
        title: "Błąd",
        description: "Nazwa kategorii nie może być pusta.",
        variant: "destructive",
      })
      return
    }
    
    if (allCategories.includes(trimmedName)) {
      toast({
        title: "Błąd", 
        description: "Ta kategoria już istnieje.",
        variant: "destructive",
      })
      return
    }
    
    // Add new category to context
    addCustomExpenseCategory(trimmedName)
    
    // Set as selected value
    field.onChange(trimmedName)
    
    // Reset UI state
    setIsAddingNewCategory(false)
    setNewCategoryName("")
  }

  const handleCancelAddCategory = () => {
    setIsAddingNewCategory(false)
    setNewCategoryName("")
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/budget" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              size="icon"
              className="w-10 h-10 bg-destructive hover:bg-destructive/90"
            >
              <Trash size={24} weight="light" color="#FFFFFF" />
            </Button>
            
            <Button 
              type="button"
              onClick={() => form.handleSubmit(onSubmit)()}
              size="icon"
              className="w-10 h-10 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              <Check size={24} weight="light" />
            </Button>
          </div>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Edytuj wydatek</h1>
          <p className="text-muted-foreground font-barlow text-lg">Wprowadź zmiany w wydatku</p>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div 
          className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/budget" 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#000000" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Edytuj wydatek</h1>
          <p className="text-muted-foreground font-barlow text-lg">Wprowadź zmiany w wydatku</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground font-cormorant">Szczegóły wydatku</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="expense-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Nazwa wydatku */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-barlow">Nazwa wydatku *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="np. Sala weselna" 
                        {...field}
                        className="font-barlow"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kwota */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-barlow">
                      Kwota całkowita *
                    </FormLabel>
                    <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Wprowadź kwotę"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(0);
                            } else {
                              const parsedValue = parseFloat(value);
                              field.onChange(isNaN(parsedValue) ? 0 : parsedValue);
                            }
                          }}
                          className="font-barlow"
                        />
                    </FormControl>
                    <FormDescription className="font-barlow text-xs">
                      Kwota w złotych (PLN)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kategoria */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-barlow">Kategoria *</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="font-barlow">
                          <SelectValue placeholder="Wybierz kategorię" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allCategories.map((category) => (
                          <SelectItem key={category} value={category} className="font-barlow">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    
                    {!isAddingNewCategory ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingNewCategory(true)}
                        className="mt-2 font-barlow text-primary"
                      >
                        <Plus size={16} weight="light" className="mr-1" />
                        Dodaj nową kategorię
                      </Button>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Nazwa kategorii"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddNewCategory(field)
                            } else if (e.key === 'Escape') {
                              handleCancelAddCategory()
                            }
                          }}
                          className="font-barlow"
                          autoFocus
                        />
                        <Button
                          type="button"
                          onClick={() => handleAddNewCategory(field)}
                          size="sm"
                          className="font-barlow"
                          disabled={!newCategoryName.trim()}
                        >
                          Dodaj
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCancelAddCategory}
                          variant="outline"
                          size="sm"
                          className="font-barlow"
                        >
                          Anuluj
                        </Button>
                      </div>
                    )}
                  </FormItem>
                )}
              />

               {/* Typ wydatku */}
              <FormField
                control={form.control}
                name="isDeposit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-barlow">
                        Zaliczka
                      </FormLabel>
                      <FormDescription className="font-barlow text-xs">
                        Czy ten wydatek to zaliczka?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />


              {/* Notatka */}
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-barlow">Notatka</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="np. szczegóły kontaktu, warunki, rabat..."
                        className="min-h-[100px] font-barlow"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="font-barlow text-xs">
                      Opcjonalne dodatkowe informacje o wydatku
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Desktop action buttons */}
              <div className="hidden md:flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex-1 font-barlow"
                  >
                    Anuluj
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 font-barlow bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
                  </Button>
                </div>
                
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full font-barlow"
                >
                  Usuń wydatek
                </Button>
              </div>

              {/* Mobile action buttons */}
              <div className="md:hidden flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex-1 font-barlow"
                  >
                    Anuluj
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 font-barlow"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Zapisywanie..." : "Zapisz"}
                  </Button>
                </div>
                
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full font-barlow"
                >
                  Usuń wydatek
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>

      <ExpenseDeleteConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        expenseTitle={expense?.title || ""}
      />
    </div>
  )
}
