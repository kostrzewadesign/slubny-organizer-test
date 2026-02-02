import React from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface ExpenseQuickActionsProps {
  isVisible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ExpenseQuickActions({ isVisible, onEdit, onDelete, onClose }: ExpenseQuickActionsProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute right-0 top-0 h-full flex items-center bg-background border border-border/30 rounded-r-2xl shadow-card px-2 gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
          onClose();
        }}
        className="h-8 w-8 hover:bg-primary/10"
      >
        <PencilSimple size={16} weight="light" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className="h-8 w-8 hover:bg-destructive/10 text-destructive"
      >
        <Trash size={16} weight="light" />
      </Button>
    </div>
  );
}