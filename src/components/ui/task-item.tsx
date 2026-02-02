import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PriorityChip } from '@/components/ui/priority-chip';
import { TaskQuickActions } from '@/components/ui/task-quick-actions';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Task } from '@/context/TaskContext';

interface TaskItemProps {
  task: Task;
  activeTaskActions: string | null;
  onToggle: (taskId: string) => void;
  onSetActiveActions: (taskId: string) => void;
  onShowActionSheet: (taskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function TaskItem({
  task,
  activeTaskActions,
  onToggle,
  onSetActiveActions,
  onShowActionSheet,
  onEdit,
  onDelete,
  className,
  style
}: TaskItemProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("relative px-1", className)} style={style} id={`task-${task.id}`}>
      <Card 
        className={`cursor-pointer transition-all duration-200 ${
          task.completed 
            ? '!shadow-none !border-0 border-transparent !ring-0 focus:!ring-0 focus-visible:!ring-0 hover:!ring-0 outline-none focus:!outline-none' 
            : 'bg-white shadow-card hover:shadow-card-hover border border-border/30'
        }`}
        style={task.completed ? { backgroundColor: 'hsla(73, 51%, 94%, 0.4)' } : undefined}
        onClick={() => navigate(`/tasks/edit/${task.id}`, { state: { scrollToId: task.id } })}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div onClick={(e) => e.stopPropagation()} className="p-2 -m-2">
                <Checkbox 
                  checked={task.completed}
                  onCheckedChange={() => onToggle(task.id)}
                  aria-label={`Oznacz zadanie ${task.title} jako ${task.completed ? 'nieukończone' : 'ukończone'}`}
                />
              </div>
              <span 
                className={`
                  font-barlow text-sm md:text-base flex-1 transition-all duration-200
                  ${task.completed 
                    ? 'text-primary line-through' 
                    : 'text-[#1E1E1E]'
                  }
                `}
              >
                {task.title}
              </span>
            </div>
            <div className="flex items-center ml-3">
              <PriorityChip 
                isPriority={task.isPriority}
                isCompleted={task.completed}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <TaskQuickActions
        isVisible={activeTaskActions === task.id}
        onEdit={() => {
          
          onEdit();
        }}
        onDelete={() => {
          
          onDelete();
        }}
        onClose={() => onSetActiveActions('')}
      />
    </div>
  );
}