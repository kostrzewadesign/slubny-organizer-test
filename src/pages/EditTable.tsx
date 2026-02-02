import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ArrowLeft, Check, Trash, X } from '@phosphor-icons/react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { useTables } from '@/context/TableContext'
import { useGuests } from '@/context/GuestContext'
import { TableFormFields, type TableFormData } from '@/components/ui/table-form-fields'
import { TableInputSchema } from '@/lib/table-validation'
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip'
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

export default function EditTable() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { tableId } = useParams<{ tableId: string }>()
  const { tables, updateTable, deleteTable } = useTables()
  const { guests, updateGuest } = useGuests()
  const scrollToId = location.state?.scrollToId
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const table = tables.find(t => t.id === tableId)
  
  const form = useForm<TableFormData>({
    resolver: zodResolver(TableInputSchema),
    defaultValues: {
      name: "",
      seats: 6,
      notes: ""
    }
  })

  // Pre-fill form with table data
  useEffect(() => {
    if (table) {
      form.reset({
        name: table.name,
        seats: table.seats,
        notes: table.notes || ""
      })
    }
  }, [table, form])

  // Redirect if table not found
  useEffect(() => {
    if (!table && tables.length > 0) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono stołu",
        variant: "destructive",
      })
      navigate('/seating')
    }
  }, [table, tables, navigate, toast])

  // Get guests assigned to this table
  const assignedGuests = table ? guests.filter(guest => guest.tableAssignment === table.id) : []

  const onSubmit = async (data: TableFormData) => {
    if (!tableId) return

    try {
      await updateTable(tableId, {
        name: data.name,
        seats: data.seats,
        notes: data.notes || ''
      })
      
      toast({
        title: "Sukces",
        description: "Stół został zaktualizowany",
      })
      
      navigate('/seating', { state: { scrollToId: tableId } })
    } catch (error) {
      console.error('Error updating table:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować stołu. Spróbuj ponownie.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveGuestFromTable = async (guestId: string) => {
    try {
      await updateGuest(guestId, { tableAssignment: null })
      toast({
        title: "Sukces",
        description: "Gość został usunięty ze stołu",
      })
    } catch (error) {
      console.error('Error removing guest from table:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć gościa ze stołu",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTable = async () => {
    if (!tableId) return

    try {
      // First, remove all guests from this table
      for (const guest of assignedGuests) {
        await updateGuest(guest.id, { tableAssignment: null })
      }

      // Then delete the table
      await deleteTable(tableId)
      
      setDeleteDialogOpen(false)
      toast({
        title: "Sukces",
        description: "Stół został usunięty",
      })
      navigate('/seating')
    } catch (error) {
      console.error('Error deleting table:', error)
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć stołu. Spróbuj ponownie.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    navigate('/seating', { state: { scrollToId } })
  }

  if (!table) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
            to="/seating" 
            state={{ scrollToId }}
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
          <h1 className="text-4xl font-cormorant font-bold text-foreground mb-3">Edytuj stół</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zaktualizuj szczegóły stołu</p>
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
            to="/seating"
            state={{ scrollToId }}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft size={24} weight="light" className="text-foreground" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-foreground mb-3">Edytuj stół</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zaktualizuj szczegóły stołu</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-2xl pb-8">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground font-cormorant">Szczegóły stołu</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="table-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <TableFormFields 
                  control={form.control}
                  errors={form.formState.errors}
                />

                {/* Assigned Guests Section */}
                {assignedGuests.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-barlow font-semibold text-foreground">
                        Przypisani goście ({assignedGuests.length})
                      </h3>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {assignedGuests.map((guest) => (
                        <Card key={guest.id} className="p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-barlow text-foreground font-medium">
                                {guest.firstName} {guest.lastName}
                              </span>
                              <RSVPStatusChip status={guest.rsvpStatus} />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveGuestFromTable(guest.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <X size={16} weight="light" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

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
                    Usuń stół
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
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten stół?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Stół zostanie usunięty, a wszyscy przypisani goście ({assignedGuests.length}) zostaną przeniesieni do nieprzypisanych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
