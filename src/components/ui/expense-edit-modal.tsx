import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Expense } from '@/context/TaskContext';

const expenseSchema = z.object({
  title: z.string().min(1, 'Tytuł jest wymagany'),
  amount: z.string().min(1, 'Kwota jest wymagana'),
  isDeposit: z.boolean(),
  paymentStatus: z.enum(['none', 'paid']),
  note: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Expense>) => void;
  expense: Expense | null;
}

export function ExpenseEditModal({ isOpen, onClose, onSave, expense }: ExpenseEditModalProps) {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: '',
      isDeposit: false,
      paymentStatus: 'none',
      note: '',
    },
  });

  useEffect(() => {
    if (isOpen && expense) {
      form.reset({
        title: expense.title,
        amount: expense.amount.toString(),
        isDeposit: expense.isDeposit,
        paymentStatus: expense.paymentStatus,
        note: expense.note || '',
      });
    }
  }, [isOpen, expense, form]);

  const handleSubmit = (data: ExpenseFormData) => {
    if (!expense) return;

    try {
      // Parse amount
      const amount = parseFloat(data.amount.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        form.setError('amount', { message: 'Podaj prawidłową kwotę' });
        return;
      }

      onSave({
        title: data.title.trim(),
        amount,
        isDeposit: data.isDeposit,
        paymentStatus: data.paymentStatus,
        note: data.note?.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.,]/g, '');
    form.setValue('amount', value);
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-[500px] bg-white"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-cormorant font-bold text-[#1E1E1E]">
            Edytuj wydatek
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-[#1E1E1E]">
              Nazwa wydatku *
            </Label>
            <Input
              id="title"
              {...form.register('title')}
              className="bg-white border-gray-200"
              placeholder="np. Fotograf"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-[#1E1E1E]">
              Kwota *
            </Label>
            <Input
              id="amount"
              {...form.register('amount')}
              onChange={handleAmountChange}
              className="bg-white border-gray-200"
              placeholder="0,00"
            />
            {form.formState.errors.amount && (
              <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-medium text-[#1E1E1E]">
                Zaliczka
              </Label>
              <p className="text-sm text-muted-foreground">
                Czy ten wydatek to zaliczka?
              </p>
            </div>
            <Switch
              checked={form.watch('isDeposit')}
              onCheckedChange={(checked) => form.setValue('isDeposit', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatus" className="text-sm font-medium text-[#1E1E1E]">
              Status płatności
            </Label>
            <Select
              value={form.watch('paymentStatus')}
              onValueChange={(value: 'none' | 'paid') => 
                form.setValue('paymentStatus', value)
              }
            >
              <SelectTrigger className="bg-white border-gray-200">
                <SelectValue placeholder="Wybierz status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Do zapłaty</SelectItem>
                <SelectItem value="paid">Zapłacone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm font-medium text-[#1E1E1E]">
              Notatka
            </Label>
            <Textarea
              id="note"
              {...form.register('note')}
              className="bg-white border-gray-200 min-h-[80px]"
              placeholder="Dodaj notatkę do wydatku..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Zapisz
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { ExpenseFormData };