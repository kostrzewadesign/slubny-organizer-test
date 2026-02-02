import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ExpenseActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  expenseTitle: string;
  expenseAmount: string;
  expenseNote?: string;
}

export function ExpenseActionModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  expenseTitle, 
  expenseAmount,
  expenseNote
}: ExpenseActionModalProps) {
  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-sm p-6 bg-background border-primary/20 rounded-2xl shadow-card">
        <DialogHeader>
          <DialogTitle className="text-left font-cormorant text-xl mb-2">
            {expenseTitle}
          </DialogTitle>
          <div className="text-left">
            <p className="text-sm font-semibold text-[#1E1E1E] font-barlow mb-1">
              {expenseAmount}
            </p>
            {expenseNote && (
              <p className="text-sm text-muted-foreground font-barlow">
                {expenseNote}
              </p>
            )}
          </div>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button
            variant="default"
            onClick={handleEdit}
            className="w-[90%] mx-auto h-12 flex items-center justify-center"
          >
            <span className="text-sm font-barlow">Edytuj</span>
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="w-[90%] mx-auto h-12 flex items-center justify-center"
          >
            <span className="text-sm font-barlow">Usuń</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}