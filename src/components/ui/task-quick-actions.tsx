import React from 'react';
import { PencilSimple, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

interface TaskQuickActionsProps {
  isVisible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function TaskQuickActions({ isVisible, onEdit, onDelete, onClose }: TaskQuickActionsProps) {
  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop to close */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Actions panel */}
      <div 
        className="absolute right-0 top-0 bottom-0 z-50 flex items-center bg-primary shadow-card animate-slide-in-right"
        role="toolbar"
        aria-label="Akcje zadania"
      >
        <div className="flex items-center px-3 space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 p-0 hover:bg-primary-dark text-white hover:text-white"
            onClick={onEdit}
            aria-label="Edytuj zadanie"
          >
            <PencilSimple size={24} weight="light" className="text-white" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 p-0 hover:bg-primary-dark text-white hover:text-white"
            onClick={onDelete}
            aria-label="Usuń zadanie"
          >
            <Trash size={24} weight="light" className="text-white" />
          </Button>
        </div>
      </div>
    </>
  );
}