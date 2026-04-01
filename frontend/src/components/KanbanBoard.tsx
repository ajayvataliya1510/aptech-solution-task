'use client';

import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent 
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/api';
import { TaskCard } from './TaskCard';
import { useUpdateTask } from '@/hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Props {
  projectId: string;
  tasks: Task[];
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

export const KanbanBoard = ({ projectId, tasks: initialTasks }: Props) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const updateMutation = useUpdateTask();
  const queryClient = useQueryClient();

  // Sync prop changes (when sorting/filters update from above)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requires minimum 5px movement before drag activates giving room for clicks
      },
    }),
    useSensor(KeyboardSensor)
  );

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find the task we are dragging
    const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
    let newStatus = tasks[activeTaskIndex].status;

    // Figure out the new status. Either we dragged over a column, or over another task
    const isOverColumn = COLUMNS.some(col => col.id === overId);
    if (isOverColumn) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    // Attempt the Optimistic Update
    if (tasks[activeTaskIndex].status !== newStatus) {
       const originalTasks = [...tasks];
       const updatedTasks = [...tasks];
       updatedTasks[activeTaskIndex] = { ...updatedTasks[activeTaskIndex], status: newStatus };
       
       // Update Local Component State
       setTasks(updatedTasks);
       // Update React Query Cache Optimistically
       queryClient.setQueryData(['tasks', projectId, {}], updatedTasks);

       try {
         await updateMutation.mutateAsync({ id: activeId as string, project_id: projectId, status: newStatus });
       } catch (error) {
         // Rollback on failure
         setTasks(originalTasks);
         queryClient.setQueryData(['tasks', projectId, {}], originalTasks);
         toast.error("Failed to update task status. Rolling back.");
       }
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start h-full">
        {COLUMNS.map(column => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div 
              key={column.id} 
              className="flex-1 min-w-[280px] bg-gray-100 rounded-xl p-4 flex flex-col h-full hidden-scrollbar shadow-inner border border-gray-200"
            >
               <div className="flex items-center justify-between mb-4 px-1">
                 <h2 className="font-bold text-gray-700 capitalize flex items-center gap-2">
                   {column.title}
                   <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                     {columnTasks.length}
                   </span>
                 </h2>
               </div>

               <div className="flex-1 flex flex-col gap-3 min-h-[150px]">
                 <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                   {columnTasks.map(task => (
                     <TaskCard key={task.id} task={task} />
                   ))}
                 </SortableContext>
               </div>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
