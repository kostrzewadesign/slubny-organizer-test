import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useGuests } from '@/context/GuestContext';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
export interface GuestFormData {
  fullName: string;
  group: string;
  isChild: boolean;
  rsvpStatus: 'confirmed' | 'declined' | 'pending';
  email?: string;
  phone?: string;
  accommodation: boolean;
  transport: boolean;
  isCompanion: boolean;
  hasDietaryRestrictions: boolean;
  hasDiscount: boolean;
  isServiceProvider: boolean;
  notes?: string;
}
export interface SharedGuestFormProps {
  form: UseFormReturn<GuestFormData>;
  onSubmit: (data: GuestFormData) => void;
  isSubmitting: boolean;
  formId: string;
  companionOfGuestId?: string;
  isCouple?: boolean;
}
export function SharedGuestForm({
  form,
  onSubmit,
  isSubmitting,
  formId,
  companionOfGuestId,
  isCouple = false
}: SharedGuestFormProps) {
  const {
    availableGroups,
    addCustomGroup
  } = useGuests();
  const [showCustomGroupInput, setShowCustomGroupInput] = useState(false);
  const [customGroupName, setCustomGroupName] = useState("");
  const handleAddCustomGroup = () => {
    if (customGroupName.trim()) {
      const groupKey = customGroupName.toLowerCase().replace(/\s+/g, '-');
      addCustomGroup(groupKey, customGroupName);
      form.setValue('group', groupKey);
      setCustomGroupName("");
      setShowCustomGroupInput(false);
    }
  };
  return <div className="space-y-8">
      {/* Dane podstawowe */}
      <div className="space-y-6">
        <h3 className="text-lg font-cormorant font-bold text-foreground">Dane podstawowe</h3>
        
        {/* Imię i Nazwisko */}
        <FormField control={form.control} name="fullName" render={({
        field
      }) => <FormItem>
              <FormLabel className="font-barlow">Imię i nazwisko</FormLabel>
              
              <FormControl>
                <Input placeholder="np. Anna W." {...field} className={`font-barlow ${form.formState.errors.fullName ? 'border-red-500' : ''}`} />
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-barlow" />
            </FormItem>} />

        {/* Grupa - hidden for couple */}
        {!isCouple && <FormField control={form.control} name="group" render={({
        field
      }) => <FormItem>
                <FormLabel className="font-barlow">Grupa *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={`font-barlow ${form.formState.errors.group ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Wybierz grupę" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(availableGroups).filter(([key]) => key !== 'couple').map(([key, label]) => <SelectItem key={key} value={key} className="font-barlow">
                          {label}
                        </SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-500 text-sm font-barlow" />
                
                {!showCustomGroupInput ? <Button type="button" variant="ghost" size="sm" onClick={() => setShowCustomGroupInput(true)} className="mt-2 font-barlow text-primary">
                    <Plus className="w-4 h-4 mr-1" />
                    Dodaj własną grupę
                  </Button> : <div className="flex gap-2 mt-2">
                    <Input placeholder="Nazwa grupy" value={customGroupName} onChange={e => setCustomGroupName(e.target.value)} className="font-barlow" />
                    <Button type="button" onClick={handleAddCustomGroup} size="sm" className="font-barlow">
                      Dodaj
                    </Button>
                    <Button type="button" onClick={() => {
            setShowCustomGroupInput(false);
            setCustomGroupName("");
          }} variant="outline" size="sm" className="font-barlow">
                      Anuluj
                    </Button>
                  </div>}
              </FormItem>} />}

        {/* Status RSVP */}
        <FormField control={form.control} name="rsvpStatus" render={({
        field
      }) => <FormItem className="space-y-3">
              <FormLabel className="font-barlow">Status RSVP *</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-3">
                  {/* Oczekuje - ŻÓŁTY */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${field.value === 'pending' ? "bg-warning border-warning text-white" : "bg-warning/10 border-warning/30 text-warning-foreground hover:border-warning/50"}`}>
                    <input type="radio" value="pending" checked={field.value === 'pending'} onChange={() => field.onChange('pending')} className="sr-only" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${field.value === 'pending' ? "border-white bg-white" : "border-warning bg-transparent"}`}>
                      {field.value === 'pending' && <div className="w-3 h-3 rounded-full bg-warning" />}
                    </div>
                    <span className="font-barlow font-medium text-base">Oczekuje</span>
                  </label>

                  {/* Potwierdzone - ZIELONY */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${field.value === 'confirmed' ? "bg-primary border-primary text-white" : "bg-primary/10 border-primary/30 text-primary hover:border-primary/50"}`}>
                    <input type="radio" value="confirmed" checked={field.value === 'confirmed'} onChange={() => field.onChange('confirmed')} className="sr-only" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${field.value === 'confirmed' ? "border-white bg-white" : "border-primary bg-transparent"}`}>
                      {field.value === 'confirmed' && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                    <span className="font-barlow font-medium text-base">Potwierdzone</span>
                  </label>

                  {/* Odmówione - CZERWONY */}
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${field.value === 'declined' ? "bg-danger border-danger text-white" : "bg-danger/10 border-danger/30 text-danger hover:border-danger/50"}`}>
                    <input type="radio" value="declined" checked={field.value === 'declined'} onChange={() => field.onChange('declined')} className="sr-only" />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${field.value === 'declined' ? "border-white bg-white" : "border-danger bg-transparent"}`}>
                      {field.value === 'declined' && <div className="w-3 h-3 rounded-full bg-danger" />}
                    </div>
                    <span className="font-barlow font-medium text-base">Odmówione</span>
                  </label>
                </div>
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-barlow" />
            </FormItem>} />
      </div>

      {/* Opcje - wszystkie toggles razem */}
      <div className="space-y-6">
        <h3 className="text-lg font-cormorant font-bold text-foreground">Opcje</h3>
        
        <div className="space-y-2">
          {/* Nocleg */}
          <FormField control={form.control} name="accommodation" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between py-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Nocleg</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    Czy gość potrzebuje noclegu
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />

          {/* Transport */}
          <FormField control={form.control} name="transport" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between py-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Transport</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    Czy gość potrzebuje transportu
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />

          {/* Osoba towarzysząca - disabled when isChild is true */}
          <FormField control={form.control} name="isCompanion" render={({
          field
        }) => {
            const isChild = form.watch('isChild');
            return (
              <FormItem className={`flex flex-row items-center justify-between py-3 ${isChild ? 'opacity-50' : ''}`}>
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Osoba towarzysząca</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    {isChild ? 'Dziecko nie może być osobą towarzyszącą' : 'Czy gość jest osobą towarzyszącą'}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    disabled={isChild}
                  />
                </FormControl>
              </FormItem>
            );
          }} />

          {/* Dziecko */}
          <FormField control={form.control} name="isChild" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between py-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Dziecko</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    Czy gość jest dzieckiem
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      // When marking as child, automatically uncheck isCompanion and isServiceProvider
                      if (checked) {
                        form.setValue('isCompanion', false);
                        form.setValue('isServiceProvider', false);
                      }
                    }} 
                  />
                </FormControl>
              </FormItem>} />

          {/* Usługodawca - disabled when isChild is true */}
          <FormField control={form.control} name="isServiceProvider" render={({
          field
        }) => {
            const isChild = form.watch('isChild');
            return (
              <FormItem className={`flex flex-row items-center justify-between py-3 ${isChild ? 'opacity-50' : ''}`}>
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Usługodawca</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    {isChild ? 'Dziecko nie może być usługodawcą' : 'Czy gość to usługodawca'}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    disabled={isChild}
                  />
                </FormControl>
              </FormItem>
            );
          }} />

          {/* Dieta specjalna */}
          <FormField control={form.control} name="hasDietaryRestrictions" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between py-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Dieta specjalna</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    Czy gość ma specjalne wymagania dietetyczne
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />

          {/* Zniżka / Bezpłatny */}
          <FormField control={form.control} name="hasDiscount" render={({
          field
        }) => <FormItem className="flex flex-row items-center justify-between py-3">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-barlow">Zniżka / Bezpłatny</FormLabel>
                  <FormDescription className="font-barlow text-xs">
                    Czy gość ma zniżkę lub jest bezpłatny
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>} />
        </div>
      </div>

      {/* Kontakt */}
      <div className="space-y-6">
        <h3 className="text-lg font-cormorant font-bold text-foreground">Kontakt</h3>
        
        {/* Email */}
        <FormField control={form.control} name="email" render={({
        field
      }) => <FormItem>
              <FormLabel className="font-barlow">Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} className="font-barlow" />
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-barlow" />
            </FormItem>} />

        {/* Telefon */}
        <FormField control={form.control} name="phone" render={({
        field
      }) => <FormItem>
              <FormLabel className="font-barlow">Telefon</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+48 123 456 789" {...field} className="font-barlow" />
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-barlow" />
            </FormItem>} />
      </div>

      {/* Notatki */}
      <div className="space-y-6">
        <h3 className="text-lg font-cormorant font-bold text-foreground">Notatki</h3>
        
        <FormField control={form.control} name="notes" render={({
        field
      }) => <FormItem>
              <FormLabel className="font-barlow">Notatki</FormLabel>
              <FormControl>
                <Textarea placeholder="Dodatkowe informacje o gościu..." className="resize-none font-barlow" {...field} />
              </FormControl>
              <FormMessage className="text-red-500 text-sm font-barlow" />
            </FormItem>} />
      </div>
    </div>;
}