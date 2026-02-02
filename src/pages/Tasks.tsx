import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Plus, CaretDown } from '@phosphor-icons/react';
import divider from '@/assets/divider.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTask, Task } from '@/context/TaskContext';
import { TaskItem } from '@/components/ui/task-item';
import { TaskActionModal } from '@/components/ui/task-action-modal';
import { TaskEditModal } from '@/components/ui/task-edit-modal';
import { TaskDeleteConfirm } from '@/components/ui/task-delete-confirm';
import { CategoryEditModal } from '@/components/ui/category-edit-modal';
import { CategoryCompletedModal } from '@/components/ui/category-completed-modal';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect, useRef } from 'react';

// Tasks page component with gesture support
export default function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    tasks,
    toggleTask,
    editTask,
    deleteTask,
    editTaskCategory
  } = useTask();
  const {
    toast
  } = useToast();

  // State for gesture actions
  const [activeTaskActions, setActiveTaskActions] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [completedCategoryModal, setCompletedCategoryModal] = useState<string | null>(null);
  
  // State for accordion sections
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  // Track previous category completion states to detect changes
  const previousCategoryStatesRef = useRef<Record<string, boolean>>({});
  const addTaskToCategory = (category: string) => {
    navigate(`/tasks/new?category=${encodeURIComponent(category)}`);
  };
  const handleAddTask = () => {
    navigate('/tasks/new');
  };
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  // Zero-division protection for progress calculation
  const progressPercentage = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Separate completed and active categories
  const activeCategories: Record<string, Task[]> = {};
  const completedCategories: Record<string, Task[]> = {};
  const currentCategoryStates: Record<string, boolean> = {};
  
  Object.entries(tasksByCategory).forEach(([category, categoryTasks]) => {
    const allCompleted = categoryTasks.every(task => task.completed);
    currentCategoryStates[category] = allCompleted;
    
    if (allCompleted) {
      completedCategories[category] = categoryTasks;
    } else {
      activeCategories[category] = categoryTasks;
    }
  });

  // Set default expanded section on first load - only "Etap 1" category
  useEffect(() => {
    const saved = localStorage.getItem('tasks-expanded-sections');
    if (saved) {
      setExpandedSections(JSON.parse(saved));
    } else {
      // Default to only "Etap 1" expanded on first visit
      const categories = Object.keys(activeCategories);
      const defaultCategory = categories.includes('Etap 1')
        ? ['Etap 1']
        : categories.slice(0, 1); // First category if "Etap 1" doesn't exist
      setExpandedSections(defaultCategory);
    }
  }, []); // Run only once on mount

  const handleAccordionChange = (values: string[]) => {
    setExpandedSections(values);
    localStorage.setItem('tasks-expanded-sections', JSON.stringify(values));
  };

  // Detect when a category becomes completed
  useEffect(() => {
    Object.entries(currentCategoryStates).forEach(([category, isCompleted]) => {
      const wasCompleted = previousCategoryStatesRef.current[category];
      
      // Show modal when category transitions from incomplete to complete
      if (isCompleted && wasCompleted === false) {
        setCompletedCategoryModal(category);
      }
    });
    
    // Update ref for next render
    previousCategoryStatesRef.current = currentCategoryStates;
  }, [tasks]);

  // Scroll to task after edit
  useEffect(() => {
    const scrollToId = location.state?.scrollToId;
    if (scrollToId && tasks.length > 0) {
      // Find the task and its category
      const task = tasks.find(t => t.id === scrollToId);
      
      if (task) {
        // Open the accordion section if not already open
        setExpandedSections(prev => {
          if (!prev.includes(task.category)) {
            const newSections = [...prev, task.category];
            localStorage.setItem('tasks-expanded-sections', JSON.stringify(newSections));
            return newSections;
          }
          return prev;
        });
        
        // Wait for DOM to render and scroll
        setTimeout(() => {
          const element = document.getElementById(`task-${scrollToId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('highlight-flash');
            setTimeout(() => element.classList.remove('highlight-flash'), 2000);
          }
        }, 150);
      }
      
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tasks]);


  // Action handlers with error boundaries and logging
  const handleEditTask = useCallback((updates: {
    title: string;
    description?: string;
  }) => {
    if (editingTask) {
      try {
        editTask(editingTask.id, updates);
      } catch (error) {
        console.error('Error editing task:', error);
        toast({
          title: "Błąd podczas edycji zadania",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  }, [editingTask, editTask, toast]);
  const handleDeleteTask = useCallback(() => {
    if (deletingTask) {
      try {
        deleteTask(deletingTask.id);
      } catch (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Błąd podczas usuwania zadania",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  }, [deletingTask, deleteTask, toast]);
  const handleEditCategory = useCallback((newName: string) => {
    if (editingCategory) {
      try {
        editTaskCategory(editingCategory, newName);
      } catch (error) {
        console.error('Error editing category:', error);
        toast({
          title: "Błąd podczas edycji kategorii",
          variant: "destructive",
          duration: 3000
        });
      }
    }
  }, [editingCategory, editTaskCategory, toast]);
  return <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Mobile header with botanical background */}
      <div className="md:hidden relative">
        <div className="absolute top-0 left-0 right-0 h-64 bg-no-repeat bg-top bg-cover pointer-events-none animate-float" style={{
        backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`
      }} />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95">
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <button onClick={handleAddTask} className="w-10 h-10 flex items-center justify-center bg-primary rounded-lg transition-colors transition-transform duration-200 active:scale-95">
            <Plus size={24} weight="light" color="#FFFFFF" />
          </button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3 animate-fade-in">Lista zadań</h1>
          <p className="text-muted-foreground font-barlow text-lg animate-fade-in">Śledzcie postępy przygotowań do ślubu</p>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block">
        <div className="absolute top-0 left-0 right-0 h-80 opacity-30 bg-no-repeat bg-center bg-cover pointer-events-none animate-float" style={{
        backgroundImage: `url(/lovable-uploads/7238c2ee-740c-44af-b1a5-e7f0f6131661.png)`
      }} />
        
        {/* Navigation icons */}
        <div className="relative z-10 flex items-center justify-between p-4">
          <Link to="/dashboard" className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm">
            <ArrowLeft size={24} weight="light" color="#FFFFFF" />
          </Link>
          
          <button onClick={handleAddTask} className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#A3B368] shadow-sm">
            <Plus size={24} weight="light" color="#FFFFFF" />
          </button>
        </div>
        
        {/* Centered title section */}
        <div className="relative z-10 text-center px-4 pb-8">
          <h1 className="text-4xl font-cormorant font-bold text-[#1E1E1E] mb-3">Lista zadań</h1>
          <p className="text-muted-foreground font-barlow text-lg">Śledzcie postępy przygotowań do ślubu</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 space-y-6">

        {/* Progress Overview */}
        <div className="bg-transparent">
          <div className="pb-2">
            <h3 className="text-foreground font-cormorant text-2xl font-bold">Postęp ogólny</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="w-full bg-[hsl(var(--progress-track))] rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-1000 ease-out" style={{
                width: `${progressPercentage}%`
              }} />
              </div>
              <span className="ml-4 text-sm font-semibold text-foreground">{progressPercentage}%</span>
            </div>
            <p className="text-sm text-muted-foreground font-barlow">{completedTasks} z {totalTasks} zadań ukończonych</p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center my-8">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Active Task List */}
        {Object.keys(activeCategories).length > 0 ? <Accordion type="multiple" value={expandedSections} onValueChange={handleAccordionChange} className="space-y-6">
            {Object.entries(activeCategories).map(([category, categoryTasks]) => {
          const completedCount = categoryTasks.filter(task => task.completed).length;
          const totalCount = categoryTasks.length;

          return <AccordionItem key={category} value={category} className="border-none">
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden" aria-label={`${category} kategoria - ${completedCount} z ${totalCount} ukończonych`}>
                  <div className="flex items-center justify-between w-full pr-4 mt-4">
                     <h2 
                       className={`text-xl font-cormorant font-semibold text-left transition-colors duration-200 break-words leading-tight ${completedCount === totalCount ? 'text-success' : 'text-foreground'}`}
                       onClick={(e) => {
                         e.stopPropagation();
                         setEditingCategory(category);
                       }}
                     >
                       {category}
                     </h2>
                     <div className="flex items-center space-x-3">
                       <span className={`text-sm font-barlow transition-colors duration-200 ${completedCount === totalCount ? 'text-success' : 'text-muted-foreground'}`}>
                         {completedCount}/{totalCount}
                       </span>
                      <CaretDown size={20} weight="light" className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="pt-3 pb-0 px-0" role="region" aria-label={`Zadania w kategorii ${category}`}>
                  <div className="space-y-2 mb-3">
                     {categoryTasks.length > 0 ? categoryTasks.map((task, index) => <TaskItem key={task.id} task={task} activeTaskActions={activeTaskActions} onToggle={toggleTask} onSetActiveActions={setActiveTaskActions} onShowActionSheet={setShowActionSheet} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }} onEdit={() => {
                  setEditingTask(task);
                  setActiveTaskActions(null);
                }} onDelete={() => {
                  setDeletingTask(task);
                  setActiveTaskActions(null);
                }} />) : <div className="text-center py-4 text-muted-foreground">
                          <p className="font-barlow text-sm">Brak zadań w tej kategorii</p>
                        </div>}
                   </div>
                  
                  {/* Add task button for this category */}
                  <Card className="cursor-pointer transition-all duration-200 !shadow-none !border-0 border-transparent bg-transparent" onClick={() => addTaskToCategory(category)}>
                    <CardContent className="p-2">
                      <div className="flex items-center justify-center space-x-2 text-primary">
                        <Plus size={18} weight="light" />
                        <span className="font-barlow text-sm">
                          Dodaj zadanie
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>;
        })}
          </Accordion> : <Card className="shadow-card text-center py-8">
            <CardContent>
              <h3 className="text-lg font-cormorant font-semibold mb-2">Brak zadań</h3>
              <p className="text-muted-foreground font-barlow mb-4">Zacznij od dodania pierwszego zadania</p>
              <Button onClick={handleAddTask} className="bg-primary text-white">
                <Plus size={18} weight="light" className="mr-2" />
                Dodaj pierwsze zadanie
              </Button>
            </CardContent>
          </Card>}

        {/* Completed Categories Section */}
        {/* Divider */}
        <div className="flex justify-center my-8">
          <img src={divider} alt="" className="w-full max-w-md" />
        </div>

        {/* Completed Section Header */}
        <div className="pb-4">
          <h3 className="text-foreground font-cormorant text-2xl font-bold text-center">Ukończone zadania</h3>
        </div>

        {Object.keys(completedCategories).length > 0 && <>
            {/* Completed Categories Accordion */}
            <Accordion type="multiple" defaultValue={[]} className="space-y-6">
              {Object.entries(completedCategories).map(([category, categoryTasks]) => {
            const completedCount = categoryTasks.filter(task => task.completed).length;
            const totalCount = categoryTasks.length;

            return <AccordionItem key={category} value={category} className="border-none">
                  <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden" aria-label={`${category} kategoria - ${completedCount} z ${totalCount} ukończonych`}>
                    <div className="flex items-center justify-between w-full pr-4 mt-4">
                       <h2 
                         className="text-xl font-cormorant font-semibold text-left transition-colors duration-200 break-words leading-tight text-success"
                         onClick={(e) => {
                           e.stopPropagation();
                           setEditingCategory(category);
                         }}
                       >
                         {category}
                       </h2>
                       <div className="flex items-center space-x-3">
                         <span className="text-sm font-barlow transition-colors duration-200 text-success">
                           {completedCount}/{totalCount}
                         </span>
                        <CaretDown size={20} weight="light" className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" aria-hidden="true" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="pt-3 pb-0 px-0" role="region" aria-label={`Zadania w kategorii ${category}`}>
                    <div className="space-y-2 mb-3">
                       {categoryTasks.length > 0 ? categoryTasks.map(task => <TaskItem key={task.id} task={task} activeTaskActions={activeTaskActions} onToggle={toggleTask} onSetActiveActions={setActiveTaskActions} onShowActionSheet={setShowActionSheet} onEdit={() => {
                    setEditingTask(task);
                    setActiveTaskActions(null);
                  }} onDelete={() => {
                    setDeletingTask(task);
                    setActiveTaskActions(null);
                  }} />) : <div className="text-center py-4 text-muted-foreground">
                            <p className="font-barlow text-sm">Brak zadań w tej kategorii</p>
                          </div>}
                     </div>
                    
                    {/* Add task button for this category */}
                    <Card className="cursor-pointer transition-all duration-200 !shadow-none !border-0 border-transparent bg-transparent" onClick={() => addTaskToCategory(category)}>
                      <CardContent className="p-2">
                        <div className="flex items-center justify-center space-x-2 text-primary">
                          <Plus size={18} weight="light" />
                          <span className="font-barlow text-sm">
                            Dodaj zadanie
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>;
          })}
            </Accordion>
            {/* Extra bottom spacing on mobile for easier interaction with bottom nav */}
            <div className="mb-8 md:mb-0" />
          </>}

        {/* Action Modal for Long Press */}
        <TaskActionModal isOpen={!!showActionSheet} onClose={() => setShowActionSheet(null)} onEdit={() => {
        const task = tasks.find(t => t.id === showActionSheet);
        if (task) setEditingTask(task);
      }} onDelete={() => {
        const task = tasks.find(t => t.id === showActionSheet);
        if (task) setDeletingTask(task);
      }} taskTitle={tasks.find(t => t.id === showActionSheet)?.title || ''} taskDescription={tasks.find(t => t.id === showActionSheet)?.description} />

        {/* Edit Modal */}
        <TaskEditModal isOpen={!!editingTask} onClose={() => setEditingTask(null)} onSave={handleEditTask} task={editingTask} />

        {/* Delete Confirmation */}
        <TaskDeleteConfirm isOpen={!!deletingTask} onClose={() => setDeletingTask(null)} onConfirm={handleDeleteTask} taskTitle={deletingTask?.title || ''} />

        {/* Category Edit Modal */}
        <CategoryEditModal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} onSave={handleEditCategory} currentName={editingCategory || ''} title="Edytuj kategorię zadań" />

        {/* Category Completed Modal */}
        <CategoryCompletedModal 
          isOpen={!!completedCategoryModal} 
          onClose={() => setCompletedCategoryModal(null)} 
          categoryName={completedCategoryModal || ''} 
        />
      </div>
    </div>;
}