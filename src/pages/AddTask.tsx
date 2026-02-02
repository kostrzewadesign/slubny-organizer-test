import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { ArrowLeft, Check } from '@phosphor-icons/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

import { useTask } from '@/context/TaskContext'
import { TaskFormFields, TaskFormData } from '@/components/ui/task-form-fields'

const taskSchema = z.object({
  title: z.string().min(1, "Nazwa zadania jest wymagana"),
  category: z.string().optional(),
  description: z.string().optional(),
  isPriority: z.boolean().default(false),
  
})

export default function AddTask() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addTask } = useTask()
  
  const presetCategory = searchParams.get('category')
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      category: presetCategory || "Podstawy",
      description: "",
      isPriority: false,
    }
  })

  const onSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    
    try {
      addTask({
        title: data.title,
        category: data.category || 'Podstawy',
        description: data.description,
        isPriority: data.isPriority,
      })
      
      navigate('/tasks')
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać zadania. Spróbuj ponownie.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/tasks')
  }

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
            to="/tasks" 
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
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Nowe zadanie</h1>
          <p className="text-muted-foreground font-barlow text-lg">Dodaj zadanie do swojej listy</p>
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
            to="/tasks" 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft size={24} weight="light" color="#000000" />
          </Link>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Nowe zadanie</h1>
          <p className="text-muted-foreground font-barlow text-lg">Dodaj zadanie do swojej listy</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 max-w-2xl">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground font-cormorant">Szczegóły zadania</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="task-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <TaskFormFields 
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
                    {isSubmitting ? "Zapisywanie..." : "Zapisz zadanie"}
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
  )
}