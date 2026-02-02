import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useGuests, type Guest } from "@/context/GuestContext"
import { useToast } from "@/hooks/use-toast"
import { SharedGuestForm, type GuestFormData } from "./shared-guest-form"
import { useEffect, useState } from "react"

interface GuestFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  guest?: Guest
  onEditComplete?: () => void
}

const guestSchema = z.object({
  fullName: z.string().min(1, 'Imię jest wymagane').max(120, 'Nazwa zbyt długa'),
  group: z.string().min(1, "Grupa jest wymagana"),
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
})

export function GuestFormModal({ open, onOpenChange, guest, onEditComplete }: GuestFormModalProps) {
  const { addGuest, updateGuest } = useGuests()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  useEffect(() => {
    if (guest) {
      form.reset({
        fullName: [guest.firstName, guest.lastName].filter(Boolean).join(' '),
        group: guest.group,
        isChild: guest.status === 'child',
        rsvpStatus: guest.rsvpStatus,
        email: guest.email || "",
        phone: guest.phone || "",
        accommodation: guest.accommodation,
        transport: guest.transport,
        isCompanion: !!guest.companionOfGuestId,
        hasDietaryRestrictions: !!(guest.dietaryRestrictions && guest.dietaryRestrictions.trim().length > 0),
        hasDiscount: guest.discountType !== 'none',
        isServiceProvider: guest.isServiceProvider,
        notes: guest.notes || ""
      })
    }
  }, [guest, form])

  const handleSubmit = async (data: GuestFormData) => {
    setIsSubmitting(true)
    
    try {
      // Split fullName into firstName and lastName
      const nameParts = data.fullName.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ') || null

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
        companionOfGuestId: data.isCompanion ? guest?.companionOfGuestId : undefined,
        discountType: data.hasDiscount ? 'discount' : 'none',
        dietaryRestrictions: data.hasDietaryRestrictions ? 'Tak' : undefined,
        notes: data.notes?.trim() || null,
        status: data.isChild ? 'child' : 'adult',
        role: guest?.role,
      }

      if (guest) {
        await updateGuest(guest.id, guestData as any)
        onEditComplete?.()
      } else {
        await addGuest(guestData as any)
      }
      
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się zapisać gościa. Spróbuj ponownie.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-2xl">
            {guest ? 'Edytuj gościa' : 'Dodaj gościa'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <SharedGuestForm 
              form={form}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              formId="guest-modal-form"
            />
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 font-barlow"
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                className="flex-1 font-barlow"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Zapisywanie..." : (guest ? "Zaktualizuj" : "Dodaj")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
