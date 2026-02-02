import React from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface TableFormData {
  name: string;
  seats: number;
  notes?: string;
}

interface TableFormFieldsProps {
  control: Control<TableFormData>;
  errors: FieldErrors<TableFormData>;
}

export function TableFormFields({ control, errors }: TableFormFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Name Field */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-barlow text-sm">Nazwa stołu *</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="np. Stół Rodziców"
                className={errors.name ? 'border-destructive' : ''}
                autoFocus
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Seats Field */}
      <FormField
        control={control}
        name="seats"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-barlow text-sm">Liczba miejsc *</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="1"
                max="20"
                placeholder="np. 8"
                value={field.value || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    field.onChange(0);
                  } else {
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed)) {
                      field.onChange(parsed);
                    }
                  }
                }}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                className={errors.seats ? 'border-destructive' : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Notes Field */}
      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-barlow text-sm">Notatki (opcjonalnie)</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Dodatkowe informacje o stole..."
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}