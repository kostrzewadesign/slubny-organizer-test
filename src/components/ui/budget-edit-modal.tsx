import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTask } from '@/context/TaskContext';
import { toast } from '@/hooks/use-toast';

interface BudgetEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBudget: number;
}

export function BudgetEditModal({ open, onOpenChange, currentBudget }: BudgetEditModalProps) {
  const [amount, setAmount] = useState(currentBudget.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { updateTotalBudget } = useTask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numericAmount = parseFloat(amount.replace(/\s/g, '').replace(',', '.'));
    
    // Validation
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast({
        title: "Błąd walidacji",
        description: "Wprowadź poprawną kwotę (większą od 0)",
        variant: "destructive",
      });
      return;
    }
    
    if (numericAmount > 1000000) {
      toast({
        title: "Błąd walidacji", 
        description: "Maksymalny budżet to 1 000 000 zł",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await updateTotalBudget(numericAmount);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować budżetu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only numbers, spaces, commas and dots
    const value = e.target.value.replace(/[^\d\s,.]/g, '');
    setAmount(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-cormorant text-2xl text-foreground">Edytuj budżet całkowity</DialogTitle>
          <DialogDescription className="text-muted-foreground font-barlow">
            Wprowadź nową kwotę całkowitego budżetu na ślub
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-foreground">
              Kwota (PLN)
            </Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="np. 50 000"
              className="text-lg"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Aktualna kwota: {formatCurrency(currentBudget)}
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}