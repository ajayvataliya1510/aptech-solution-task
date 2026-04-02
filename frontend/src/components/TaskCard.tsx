

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/api';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';

interface Props {
  task: Task;
  onClick?: () => void;
}

const priorityColors = {
  low: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
  high: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
};

export const TaskCard = ({ task, onClick }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-40 border-2 border-dashed border-indigo-400 bg-indigo-50 rounded-2xl h-36 w-full" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white p-5 rounded-2xl shadow-sm border ${
        isDragging ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-200 z-50' : 'border-slate-200 hover:border-indigo-300 shadow-[0_2px_10px_rgb(0,0,0,0.02)]'
      } cursor-grab active:cursor-grabbing relative flex flex-col gap-3 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md group active:scale-[0.98]`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-indigo-600 transition-colors">{task.title}</h4>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex justify-between mt-auto items-end pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
          <User className="w-3.5 h-3.5" />
          <span>{task.assignee?.name || 'Unassigned'}</span>
        </div>

        {task.due_date && (
          <div className="flex text-slate-400 text-[10px] items-center gap-1 font-medium bg-white px-2 py-1 rounded border border-transparent">
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

