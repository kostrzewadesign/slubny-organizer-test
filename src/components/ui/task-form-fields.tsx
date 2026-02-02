import React, { useState } from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useTask } from '@/context/TaskContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from '@phosphor-icons/react';
export const categories = ["Podstawy", "Finanse", "Goście", "Miejsce", "Usługi", "Strój", "Biżuteria", "Dokumenty", "Uroda", "Zaproszenia", "Transport", "Rozrywka", "Dekoracje", "Jedzenie", "Podróż", "Prezenty", "Dodatki", "Inne"];
export interface TaskFormData {
  title: string;
  category?: string;
  description?: string;
  isPriority: boolean;
}
interface TaskFormFieldsProps {
  control: Control<TaskFormData>;
  errors: FieldErrors<TaskFormData>;
}
export function TaskFormFields({
  control,
  errors
}: TaskFormFieldsProps) {
  const {
    customCategories,
    addCustomCategory
  } = useTask();
  const {
    toast
  } = useToast();
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const allCategories = [...categories, ...customCategories];
  const handleAddNewCategory = (field: any) => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast({
        title: "Błąd",
        description: "Nazwa kategorii nie może być pusta.",
        variant: "destructive"
      });
      return;
    }
    if (allCategories.includes(trimmedName)) {
      toast({
        title: "Błąd",
        description: "Ta kategoria już istnieje.",
        variant: "destructive"
      });
      return;
    }
    addCustomCategory(trimmedName);

    // Set the new category as selected
    field.onChange(trimmedName);
    toast({
      title: "Sukces",
      description: `Kategoria "${trimmedName}" została dodana.`
    });
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };
  const handleCancelAddCategory = () => {
    setNewCategoryName('');
    setIsAddingNewCategory(false);
  };
  return <div className="space-y-6">
      {/* Title Field */}
      <FormField control={control} name="title" render={({
      field
    }) => <FormItem>
            <FormLabel className="font-barlow text-sm">Nazwa zadania *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Wprowadź nazwę zadania" className={errors.title ? 'border-destructive' : ''} />
            </FormControl>
            <FormMessage />
          </FormItem>} />

      {/* Category Field */}
      <FormField control={control} name="category" render={({
      field
    }) => <FormItem>
            <FormLabel className="font-barlow text-sm">Kategoria</FormLabel>
            {!isAddingNewCategory ? <Select onValueChange={value => {
        if (value === "__add_new__") {
          setIsAddingNewCategory(true);
        } else {
          field.onChange(value);
        }
      }} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz kategorię" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allCategories.map(category => <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>)}
                  <SelectItem value="__add_new__" className="text-primary">
                    <div className="flex items-center gap-2">
                      <Plus size={16} weight="light" />
                      Dodaj własną kategorię...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select> : <div className="flex gap-2">
                <Input placeholder="Wpisz nazwę nowej kategorii" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewCategory(field);
          } else if (e.key === 'Escape') {
            handleCancelAddCategory();
          }
        }} autoFocus />
                <Button type="button" size="sm" onClick={() => handleAddNewCategory(field)} disabled={!newCategoryName.trim()}>
                  Dodaj
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={handleCancelAddCategory}>
                  <X size={16} weight="light" />
                </Button>
              </div>}
            <FormMessage />
          </FormItem>} />

      {/* Priority Switch */}
      <FormField control={control} name="isPriority" render={({
      field
    }) => <FormItem className="flex flex-row items-center justify-between py-3">
            <div className="space-y-0.5">
              <FormLabel className="font-barlow text-sm">
                Zadanie priorytetowe
              </FormLabel>
              <div className="text-sm text-muted-foreground font-barlow">
                Oznacz jako zadanie o wysokim priorytecie
              </div>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>} />

      {/* Description Field - moved to end */}
      <FormField control={control} name="description" render={({
      field
    }) => <FormItem>
            <FormLabel className="font-barlow text-sm">Opis (opcjonalnie)</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Dodaj opis zadania..." rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>} />

    </div>;
}