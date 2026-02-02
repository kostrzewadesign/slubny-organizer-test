import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { RSVPStatusChip } from '@/components/ui/rsvp-status-chip';
import { Table, useTables } from '@/context/TableContext';
import { useGuests } from '@/context/GuestContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash, X } from '@phosphor-icons/react';

interface TableEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
}

const tableSchema = z.object({
  name: z.string().min(1, "Nazwa stołu jest wymagana"),
  seats: z.number().min(1, "Liczba miejsc musi być większa niż 0"),
  notes: z.string().optional()
});

type TableFormData = z.infer<typeof tableSchema>;

export function TableEditModal({ open, onOpenChange, table }: TableEditModalProps) {
  const { updateTable, deleteTable } = useTables();
  const { guests, updateGuest } = useGuests();
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: "",
      seats: 6,
      notes: ""
    }
  });

  // Update form data when table prop changes
  useEffect(() => {
    if (table) {
      form.reset({
        name: table.name,
        seats: table.seats,
        notes: table.notes || ''
      });
    }
  }, [table, form]);

  // Get guests assigned to this table
  const assignedGuests = table ? guests.filter(guest => guest.tableAssignment === table.id) : [];

  const handleSubmit = (data: TableFormData) => {
    if (!table) return;

    updateTable(table.id, {
      name: data.name,
      seats: data.seats,
      notes: data.notes || ''
    });

    onOpenChange(false);
  };

  const handleRemoveGuestFromTable = (guestId: string) => {
    // Remove guest from table by setting tableAssignment to null
    updateGuest(guestId, { tableAssignment: null });
  };

  const handleDeleteTable = () => {
    if (!table) return;

    // First, remove all guests from this table
    assignedGuests.forEach(guest => {
      updateGuest(guest.id, { tableAssignment: null });
    });

    // Then delete the table
    deleteTable(table.id);

    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-sm max-h-[90vh] overflow-y-auto p-6 bg-background border-primary/20 rounded-2xl shadow-card">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-xl">
            Edytuj stół
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Table Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa stołu</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="np. Stół główny"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Liczba miejsc</Label>
              <Input
                id="seats"
                type="number"
                min="1"
                value={form.watch('seats') || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    form.setValue('seats', 0);
                  } else {
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed)) {
                      form.setValue('seats', parsed);
                    }
                  }
                }}
              />
              {form.formState.errors.seats && (
                <p className="text-sm text-destructive">{form.formState.errors.seats.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Dodatkowe informacje o stole..."
              />
            </div>
          </div>

          {/* Assigned Guests */}
          {assignedGuests.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Przypisani goście ({assignedGuests.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assignedGuests.map((guest) => (
                  <Card key={guest.id} className="p-3">
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

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            <Button type="submit" className="w-full">
              Zaktualizuj stół
            </Button>
            
            <div className="flex gap-3">
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="flex-1">
                    <Trash size={16} weight="light" className="mr-2" />
                    Usuń stół
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Czy na pewno chcesz usunąć ten stół?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ta akcja nie może być cofnięta. Stół zostanie usunięty, a wszyscy przypisani goście ({assignedGuests.length}) zostaną przeniesieni do nieprzypisanych.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Anuluj</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Usuń stół
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Anuluj
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}