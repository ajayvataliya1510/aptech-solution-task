import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useUpdateTask, useDeleteTask } from '@/hooks/useData';
import { Project, Task } from '@/types/api';
import { X, Calendar, User, AlignLeft, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface EditTaskModalProps {
  projectId: string;
  project: Project;
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTaskModal = ({ projectId, project, task, isOpen, onClose }: EditTaskModalProps) => {
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const taskSchema = Yup.object().shape({
    title: Yup.string().min(3, 'Title is too short').required('Task title is required'),
    description: Yup.string().max(1000, 'Description is too long').nullable(),
    status: Yup.string().oneOf(['todo', 'in_progress', 'done'] as const).required(),
    priority: Yup.string().oneOf(['low', 'medium', 'high'] as const).required(),
    assigned_to: Yup.string().nullable(),
    due_date: Yup.date()
      .nullable()
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Due date cannot be in the past'),
  });

  const formik = useFormik({
    initialValues: {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
    },
    enableReinitialize: true,
    validationSchema: taskSchema,
    onSubmit: async (values) => {
      try {
        await updateTaskMutation.mutateAsync({
          id: task.id,
          ...values,
          project_id: projectId,
          assigned_to: values.assigned_to || null,
          due_date: values.due_date || null,
        });
        onClose();
      } catch (err) {
        // Error handled in hook
      }
    },
  });

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this task? This action cannot be undone.")) {
      try {
        await deleteTaskMutation.mutateAsync({ id: task.id, project_id: projectId });
        onClose();
      } catch (err) {
        // Error handled in hook
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 ring-1 ring-slate-900/5 transform transition-all animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </span>
            Task Details
          </h3>
          <div className="flex items-center gap-2">
             <button
               type="button"
               onClick={handleDelete}
               className="text-slate-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
               title="Delete Task"
             >
               <Trash2 className="w-5 h-5" />
             </button>
             <button 
               onClick={onClose}
               className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
             >
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6">
          <div className="space-y-5 max-h-[65vh] overflow-y-auto px-1">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Title</label>
              <input
                type="text"
                name="title"
                value={formik.values.title}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`w-full rounded-xl border ${formik.touched.title && formik.errors.title ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white font-semibold`}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="mt-1.5 text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formik.errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-slate-400" />
                Description
              </label>
              <textarea
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-slate-50 hover:bg-white"
                placeholder="Add more details about this task..."
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Status</label>
                <select
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer font-medium"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Priority</label>
                <select
                  name="priority"
                  value={formik.values.priority}
                  onChange={formik.handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer font-medium"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Assignee & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Assignee
                </label>
                <select
                  name="assigned_to"
                  value={formik.values.assigned_to}
                  onChange={formik.handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer font-medium"
                >
                  <option value="">Unassigned</option>
                  {project.members?.map(member => (
                    <option key={member.user?.id} value={member.user?.id}>
                      {member.user?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formik.values.due_date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full rounded-xl border ${formik.touched.due_date && formik.errors.due_date ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white cursor-pointer font-medium`}
                />
                {formik.touched.due_date && formik.errors.due_date && (
                   <p className="mt-1.5 text-[10px] font-semibold text-red-500">{formik.errors.due_date as string}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTaskMutation.isPending}
              className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all transform active:scale-95"
            >
              {updateTaskMutation.isPending ? 'Saving...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
