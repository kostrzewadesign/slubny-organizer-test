import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UnifiedActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssignTable?: () => void;
  title: string;
  subtitle?: string;
  showAssignTable?: boolean;
}

export function UnifiedActionModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onAssignTable,
  title, 
  subtitle,
  showAssignTable = false 
}: UnifiedActionModalProps) {
  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleAssignTable = () => {
    onAssignTable?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-sm p-6 bg-background border-primary/20 rounded-2xl shadow-card">
        <DialogHeader>
          <DialogTitle className="text-left font-cormorant text-xl mb-2">
            {title}
          </DialogTitle>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-barlow text-left">
              {subtitle}
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

          {showAssignTable && onAssignTable && (
            <Button
              variant="outline"
              onClick={handleAssignTable}
              className="w-[90%] mx-auto h-12 flex items-center justify-center"
            >
              <span className="text-sm font-barlow">Przypisz do stołu</span>
            </Button>
          )}
          
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