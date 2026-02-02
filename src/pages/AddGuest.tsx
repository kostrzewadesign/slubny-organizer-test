import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ArrowLeft, Check } from '@phosphor-icons/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGuests } from '@/context/GuestContext'
import { SharedGuestForm, type GuestFormData } from '@/components/ui/shared-guest-form'

const guestSchema = z.object({
  fullName: z.string().min(1, 'Imię jest wymagane').max(120, 'Nazwa zbyt długa'),
  group: z.string().min(1, "Grupa jest wymagana"),
  isChild: z.boolean().default(false),
  rsvpStatus: z.enum(['sent', 'confirmed', 'declined', 'pending']).default('pending'),
  email: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: 'Nieprawidłowy format email' }
    ),
  phone: z.string().optional(),
  accommodation: z.boolean().default(false),
  transport: z.boolean().default(false),
  isCompanion: z.boolean().default(false),
  hasDietaryRestrictions: z.boolean().default(false),
  hasDiscount: z.boolean().default(false),
  isServiceProvider: z.boolean().default(false),
  notes: z.string().optional()
});

export default function AddGuest() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { addGuest } = useGuests()
  const lastSubmitTime = useRef<number>(0)
  const SUBMIT_DEBOUNCE_MS = 1000
  
  const companionOfGuestId = searchParams.get('companionOf')
  const preselectedGroup = searchParams.get('group')
  
  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      fullName: "",
      group: preselectedGroup || "family",
      isChild: false,
      rsvpStatus: "pending",
      email: "",
      phone: "",
      accommodation: false,
      transport: false,
      isCompanion: !!companionOfGuestId,
      hasDietaryRestrictions: false,
      hasDiscount: false,
      isServiceProvider: false,
      notes: ""
    }
  })

  const onSubmit = async (data: GuestFormData) => {
    // Debounce check
    const now = Date.now()
    if (now - lastSubmitTime.current < SUBMIT_DEBOUNCE_MS) {
      return
    }
    lastSubmitTime.current = now

    if (!user?.id) {
      toast({
        title: "Błąd uwierzytelnienia",
        description: "Musisz być zalogowany aby dodać gościa.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Store entire fullName in firstName
      const firstName = data.fullName.trim()
      const lastName = ''

      const guestData = {
        firstName,
        lastName,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        group: data.group,
        rsvpStatus: data.rsvpStatus,
        accommodation: data.accommodation,
        transport: data.transport,
        isChild: data.isChild,
        isServiceProvider: data.isServiceProvider,
        companionOfGuestId: data.isCompanion ? companionOfGuestId || undefined : undefined,
        discountType: data.hasDiscount ? 'discount' : 'none',
        dietaryRestrictions: data.hasDietaryRestrictions ? 'Tak' : undefined,
        notes: data.notes?.trim() || null,
        status: data.isChild ? 'child' : 'adult'
      }

      // Save to localStorage for retry
      localStorage.setItem('pending_guest_data', JSON.stringify(guestData))

      await addGuest(guestData as any)
      
      // Clear localStorage on success
      localStorage.removeItem('pending_guest_data')
      
      navigate('/guests')
    } catch (error) {
      console.error('Error adding guest:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd"
      
      // Differentiate error types
      if (errorMessage.includes('timeout') || errorMessage.includes('Timed out')) {
        toast({
          title: "Błąd połączenia",
          description: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie.",
          variant: "destructive",
        })
      } else if (errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        toast({
          title: "Błąd uprawnień",
          description: "Nie masz uprawnień do dodania gościa. Spróbuj się wylogować i zalogować ponownie.",
          variant: "destructive",
        })
      } else if (errorMessage.includes('validation') || errorMessage.includes('Invalid')) {
        toast({
          title: "Błąd walidacji",
          description: "Dane formularza są nieprawidłowe. Sprawdź wszystkie pola i spróbuj ponownie.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Błąd",
          description: "Nie udało się dodać gościa. Spróbuj ponownie.",
          variant: "destructive",
        })
      }
    }
  }

  const handleCancel = () => {
    navigate('/guests')
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
            to="/guests" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <Button 
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            size="icon"
            className="w-10 h-10 bg-primary hover:bg-primary/90"
            disabled={form.formState.isSubmitting}
          >
            <Check size={24} weight="light" />
          </Button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Nowy gość</h1>
          <p className="text-muted-foreground font-barlow text-lg">Dodaj gościa do listy</p>
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
            to="/guests" 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#000000" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Nowy gość</h1>
          <p className="text-muted-foreground font-barlow text-lg">Dodaj gościa do listy</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground font-cormorant">Szczegóły gościa</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="guest-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <SharedGuestForm 
                  form={form}
                  onSubmit={onSubmit}
                  isSubmitting={form.formState.isSubmitting}
                  formId="guest-form"
                  companionOfGuestId={companionOfGuestId || undefined}
                />

                {/* Desktop action buttons */}
                <div className="hidden md:flex gap-3 pt-4">
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
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Zapisywanie..." : "Zapisz gościa"}
                  </Button>
                </div>

                {/* Mobile action buttons */}
                <div className="md:hidden flex gap-3 pt-4">
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
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Zapisywanie..." : "Zapisz"}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
