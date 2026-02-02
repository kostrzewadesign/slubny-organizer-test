import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TaskActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  taskTitle: string;
  taskDescription?: string;
}

export function TaskActionModal({ isOpen, onClose, onEdit, onDelete, taskTitle, taskDescription }: TaskActionModalProps) {
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
            {taskTitle}
          </DialogTitle>
          {taskDescription && (
            <p className="text-sm text-muted-foreground font-barlow text-left">
              {taskDescription}
            </p>
          )}
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