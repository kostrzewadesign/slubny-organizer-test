import React, { useState, useEffect } from 'react';
import { X, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string) => void;
  currentName: string;
  title?: string;
}

export function CategoryEditModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentName,
  title = "Edytuj kategorię"
}: CategoryEditModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSave = () => {
    if (name.trim() && name.trim() !== currentName) {
      onSave(name.trim());
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl border border-border/30 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/20">
          <h3 className="font-cormorant font-semibold text-xl text-[#1E1E1E]">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X size={16} weight="light" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-barlow font-medium text-[#1E1E1E]">
              Nazwa kategorii
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Wprowadź nazwę kategorii..."
              className="font-barlow"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-barlow"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 font-barlow"
              disabled={!name.trim() || name.trim() === currentName}
            >
              <Check size={16} weight="light" className="mr-2" />
              Zapisz
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}