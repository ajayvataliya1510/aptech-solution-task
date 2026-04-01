'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/api';
import { format } from 'date-fns';
import { Calendar, User } from 'lucide-react';

interface Props {
  task: Task;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export const TaskCard = ({ task }: Props) => {
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
        className="opacity-30 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg h-32 w-full" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-lg shadow-sm border ${
        isDragging ? 'border-blue-500 shadow-md ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
      } cursor-grab active:cursor-grabbing relative flex flex-col gap-3 transition-colors`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}

      <div className="flex justify-between mt-auto items-end">
        <div className="flex bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] items-center gap-1 font-medium">
          <User className="w-3 h-3" />
          <span>{task.assignee?.name || 'Unassigned'}</span>
        </div>

        {task.due_date && (
          <div className="flex text-gray-400 text-[10px] items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
