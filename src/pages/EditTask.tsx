import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ArrowLeft, Check, Trash } from '@phosphor-icons/react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

import { useTask } from '@/context/TaskContext'
import { TaskFormFields, TaskFormData } from '@/components/ui/task-form-fields'
import { TaskDeleteConfirm } from '@/components/ui/task-delete-confirm'

const taskSchema = z.object({
  title: z.string().min(1, "Nazwa zadania jest wymagana"),
  category: z.string().optional(),
  description: z.string().optional(),
  isPriority: z.boolean().default(false),
})

export default function EditTask() {
  const navigate = useNavigate()
  const location = useLocation()
  const { taskId } = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { tasks, editTask, deleteTask } = useTask()
  const scrollToId = location.state?.scrollToId
  
  const task = tasks.find(t => t.id === taskId)
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      category: "Podstawy",
      description: "",
      isPriority: false,
    }
  })

  // Pre-fill form with existing task data
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        category: task.category,
        description: task.description || "",
        isPriority: task.isPriority,
      })
    }
  }, [task, form])

  // Redirect if task not found
  useEffect(() => {
    if (!task && taskId) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono zadania.",
        variant: "destructive",
      })
      navigate('/tasks')
    }
  }, [task, taskId, navigate, toast])

  const onSubmit = async (data: TaskFormData) => {
    if (!taskId) return
    
    setIsSubmitting(true)
    
    try {
      editTask(taskId, {
        title: data.title,
        category: data.category || 'Podstawy',
        description: data.description,
        isPriority: data.isPriority,
      })
      
      navigate('/tasks', { state: { scrollToId } })
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować zadania. Spróbuj ponownie.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/tasks', { state: { scrollToId } })
  }

  const handleDelete = () => {
    if (!taskId) return
    
    try {
      deleteTask(taskId)
      toast({
        title: "Usunięto zadanie",
        description: "Zadanie zostało pomyślnie usunięte.",
      })
      navigate('/tasks')
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zadania. Spróbuj ponownie.",
        variant: "destructive",
      })
    }
  }

  if (!task) {
    return null
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
          
          <div className="flex gap-2">
            <Button 
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              size="icon"
              className="w-10 h-10 bg-destructive hover:bg-destructive/90"
            >
              <Trash size={24} weight="light" color="#FFFFFF" />
            </Button>
            
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
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Edytuj zadanie</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zaktualizuj szczegóły zadania</p>
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
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Edytuj zadanie</h1>
          <p className="text-muted-foreground font-barlow text-lg">Zaktualizuj szczegóły zadania</p>
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
                <div className="hidden md:flex flex-col gap-3 pt-4">
                  <div className="flex gap-3">
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
                      className="flex-1 font-barlow bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
                    </Button>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full font-barlow"
                  >
                    Usuń zadanie
                  </Button>
                </div>

                {/* Mobile action buttons */}
                <div className="md:hidden flex flex-col gap-3 pt-4">
                  <div className="flex gap-3">
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
                      className="flex-1 font-barlow bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Zapisywanie..." : "Zapisz"}
                    </Button>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full font-barlow"
                  >
                    Usuń zadanie
                  </Button>
                </div>

              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <TaskDeleteConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        taskTitle={task.title}
      />
    </div>
  )
}