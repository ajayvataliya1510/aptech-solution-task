

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragEndEvent,
  useDroppable
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus, Project } from '@/types/api';
import { TaskCard } from './TaskCard';
import { useUpdateTask } from '@/hooks/useData';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { EditTaskModal } from './EditTaskModal';

interface Props {
  projectId: string;
  project: Project;
  tasks: Task[];
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

export const KanbanBoard = ({ projectId, project, tasks: initialTasks }: Props) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const updateMutation = useUpdateTask();
  const queryClient = useQueryClient();

  // Sync prop changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const getTasksByStatus = (status: TaskStatus) => tasks.filter(t => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine new status
    let newStatus: TaskStatus = activeTask.status;
    const isColumn = COLUMNS.some(c => c.id === overId);
    
    if (isColumn) {
      newStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (activeTask.status !== newStatus || activeId !== overId) {
       const originalTasks = [...tasks];
       const updatedTasks = [...tasks];
       const activeIndex = updatedTasks.findIndex(t => t.id === activeId);
       
       // Update locally
       updatedTasks[activeIndex] = { ...updatedTasks[activeIndex], status: newStatus };
       setTasks(updatedTasks);
       queryClient.setQueryData(['tasks', projectId, {}], updatedTasks);

       try {
         await updateMutation.mutateAsync({ id: activeId, project_id: projectId, status: newStatus });
       } catch (error) {
         setTasks(originalTasks);
         queryClient.setQueryData(['tasks', projectId, {}], originalTasks);
         toast.error("Failed to move task.");
       }
    }
  };

  return (
    <>
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col lg:flex-row gap-6 items-start h-full min-h-[600px] pb-10">
          {COLUMNS.map(column => (
            <KanbanColumn 
              key={column.id} 
              column={column} 
              tasks={getTasksByStatus(column.id)} 
              onTaskClick={setEditingTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-2 scale-105 transition-transform">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <EditTaskModal 
          projectId={projectId}
          project={project}
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
};

interface ColumnProps {
  column: { id: TaskStatus; title: string };
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const KanbanColumn = ({ column, tasks, onTaskClick }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`flex-1 min-w-[320px] rounded-3xl p-5 flex flex-col h-full border transition-all duration-200 ${
        isOver ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-slate-200/40 border-slate-200/60'
      } backdrop-blur-md shadow-sm`}
    >
      <div className="flex items-center justify-between mb-5 px-2">
        <h2 className="font-bold text-slate-800 tracking-tight flex items-center gap-2 text-lg">
          {column.title}
          <span className="bg-slate-300/50 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-slate-300">
            {tasks.length}
          </span>
        </h2>
      </div>

      <div className="flex-1 flex flex-col gap-4 min-h-[200px]">
        <SortableContext items={tasks.map(t => t.id)} strategy={rectSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
