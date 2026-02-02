import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { TableFormFields, type TableFormData } from '@/components/ui/table-form-fields';
import { useTables } from '@/context/TableContext';
import { ArrowLeft, Check } from '@phosphor-icons/react';
import { useToast } from '@/hooks/use-toast';

const tableSchema = z.object({
  name: z.string().min(1, "Nazwa stołu jest wymagana"),
  seats: z.number().min(1, "Liczba miejsc musi być większa niż 0").max(20, "Maksymalnie 20 miejsc na stół"),
  notes: z.string().optional(),
});

export default function AddTable() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addTable } = useTables();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TableFormData>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      name: '',
      seats: 8,
      notes: ''
    }
  });

  const onSubmit = async (data: TableFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log('AddTable: Submitting table data:', data);
      await addTable(data);
      
      navigate('/seating');
    } catch (error) {
      console.error('AddTable: Error adding table:', error);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się dodać stołu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/seating');
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div 
          className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/seating" 
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg"
          >
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <Button 
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            size="icon"
            className="w-10 h-10 bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            <Check size={24} weight="light" />
          </Button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Nowy stół</h1>
          <p className="text-muted-foreground font-barlow text-lg">Dodaj stół do planu</p>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div 
          className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`,
          }}
        />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link 
            to="/seating" 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#000000" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Nowy stół</h1>
          <p className="text-muted-foreground font-barlow text-lg">Dodaj stół do planu</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground font-cormorant">Szczegóły stołu</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="table-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <TableFormFields
                  control={form.control}
                  errors={form.formState.errors}
                />

                {/* Desktop action buttons */}
                <div className="hidden md:flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex-1 font-barlow"
                  >
                    Anuluj
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 font-barlow"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Zapisywanie..." : "Zapisz stół"}
                  </Button>
                </div>

                {/* Mobile action buttons */}
                <div className="md:hidden flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    className="flex-1 font-barlow"
                  >
                    Anuluj
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 font-barlow"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Zapisywanie..." : "Zapisz"}
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}