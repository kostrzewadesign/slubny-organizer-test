import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TaskFormFields, TaskFormData } from '@/components/ui/task-form-fields';
import type { Task } from '@/context/TaskContext';

const taskSchema = z.object({
  title: z.string().min(1, "Nazwa zadania jest wymagana"),
  category: z.string().optional(),
  description: z.string().optional(),
  isPriority: z.boolean().default(false),
});

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: TaskFormData) => void;
  task: Task | null;
}

export function TaskEditModal({ isOpen, onClose, onSave, task }: TaskEditModalProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      category: '',
      description: '',
      isPriority: false,
    },
  });

  useEffect(() => {
    if (task && isOpen) {
      form.reset({
        title: task.title,
        category: task.category || '',
        description: task.description || '',
        isPriority: task.isPriority,
      });
    }
  }, [task, isOpen, form]);

  const handleSubmit = (data: TaskFormData) => {
    onSave({
      title: data.title.trim(),
      category: data.category || undefined,
      description: data.description?.trim() || undefined,
      isPriority: data.isPriority,
    });
    onClose();
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="font-cormorant text-xl">Edytuj zadanie</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <TaskFormFields 
              control={form.control} 
              errors={form.formState.errors} 
            />
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto"
              >
                Anuluj
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                Zapisz
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}