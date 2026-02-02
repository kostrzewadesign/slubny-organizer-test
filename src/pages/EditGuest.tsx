import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ArrowLeft, Check, Trash } from '@phosphor-icons/react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { useGuests } from '@/context/GuestContext'
import { SharedGuestForm, type GuestFormData } from '@/components/ui/shared-guest-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import divider from '@/assets/divider.png'

const guestSchema = z.object({
  fullName: z.string().min(1, 'Imię jest wymagane').max(120, 'Nazwa zbyt długa'),
  group: z.string().optional(),
  isChild: z.boolean().default(false),
  rsvpStatus: z.enum(['confirmed', 'declined', 'pending']).default('pending'),
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

export default function EditGuest() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { guestId } = useParams<{ guestId: string }>()
  const { guests, updateGuest, deleteGuest } = useGuests()
  const scrollToId = location.state?.scrollToId
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const guest = guests.find(g => g.id === guestId)
  
  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      fullName: "",
      group: "family",
      isChild: false,
      rsvpStatus: "pending",
      email: "",
      phone: "",
      accommodation: false,
      transport: false,
      isCompanion: false,
      hasDietaryRestrictions: false,
      hasDiscount: false,
      isServiceProvider: false,
      notes: ""
    }
  })

  // Pre-fill form with guest data
  useEffect(() => {
    if (guest) {
      form.reset({
        fullName: [guest.firstName, guest.lastName].filter(Boolean).join(' '),
        group: guest.group,
        isChild: guest.isChild,
        rsvpStatus: guest.rsvpStatus,
        email: guest.email || "",
        phone: guest.phone || "",
        accommodation: guest.accommodation,
        transport: guest.transport,
        isCompanion: !!guest.companionOfGuestId,
        hasDietaryRestrictions: !!guest.dietaryRestrictions && guest.dietaryRestrictions.trim().length > 0,
        hasDiscount: guest.discountType !== 'none',
        isServiceProvider: guest.isServiceProvider,
        notes: guest.notes || ""
      })
    }
  }, [guest, form])

  // Redirect if guest not found
  useEffect(() => {
    if (!guest && guests.length > 0) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono gościa",
        variant: "destructive",
      })
      navigate('/guests')
    }
  }, [guest, guests, navigate, toast])

  const onSubmit = async (data: GuestFormData) => {
    if (!guestId) return

    try {
      // Store entire fullName in firstName
      const firstName = data.fullName.trim()
      const lastName = ''

      const updates = {
        firstName,
        lastName,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        group: data.group || guest.group,
        rsvpStatus: data.rsvpStatus,
        accommodation: data.accommodation,
        transport: data.transport,
        isChild: data.isChild,
        isServiceProvider: data.isServiceProvider,
        discountType: data.hasDiscount ? 'discount' : 'none',
        dietaryRestrictions: data.hasDietaryRestrictions ? 'Tak' : undefined,
        notes: data.notes?.trim() || undefined,
        status: data.isChild ? 'child' : 'adult',
        role: guest.role,
      }

      await updateGuest(guestId, updates as any)
      
      navigate('/guests', { state: { scrollToId: guestId } })
    } catch (error) {
      console.error('Error updating guest:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować gościa. Spróbuj ponownie.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGuest = async () => {
    if (!guestId) return

    try {
      await deleteGuest(guestId)
      
      setDeleteDialogOpen(false)
      navigate('/guests')
    } catch (error) {
      console.error('Error deleting guest:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć gościa. Spróbuj ponownie.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    navigate('/guests', { state: { scrollToId } })
  }

  if (!guest) {
    return null
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
          
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
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
              disabled={form.formState.isSubmitting}
            >
              <Check size={24} weight="light" />
            </Button>
          </div>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Edycja Gościa</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zaktualizuj szczegóły gościa</p>
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
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Edycja Gościa</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zaktualizuj szczegóły gościa</p>
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
                  isCouple={guest.group === 'couple'}
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
                    {form.formState.isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
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

                {/* Divider */}
                <div className="flex justify-center my-6">
                  <img src={divider} alt="" className="w-full max-w-md" />
                </div>

                {/* Delete section */}
                <div className="pt-4">
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full font-barlow"
                  >
                    Usuń gościa
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Alert Dialog for delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego gościa?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Gość zostanie trwale usunięty z listy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGuest} className="bg-destructive">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
