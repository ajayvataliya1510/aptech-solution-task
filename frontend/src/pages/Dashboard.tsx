

import { useState } from 'react';
import { useProjects, useCreateProject } from '@/hooks/useData';
import { logout } from '@/hooks/useAuthContent';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlusCircle, LogOut, Folder, Users, CheckSquare } from 'lucide-react';

import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useProjects(page, 10);
  const createMutation = useCreateProject();
  const [isModalOpen, setModalOpen] = useState(false);

  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = currentUserStr ? JSON.parse(currentUserStr) : null;

  const projectSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, 'Project name is too short')
      .required('Project name is required'),
    description: Yup.string().max(500, 'Description is too long'),
  });

  const formik = useFormik({
    initialValues: { name: '', description: '' },
    validationSchema: projectSchema,
    onSubmit: async (values) => {
      try {
        await createMutation.mutateAsync(values);
        setModalOpen(false);
        formik.resetForm();
      } catch (err) {
        // toast handles error in mutation hook
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="sticky top-0 z-40 w-full backdrop-blur-lg bg-white/70 border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center gap-2">
              <Folder className="w-6 h-6 text-indigo-600" />
              Aptech Task Manager
            </h1>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-slate-600 text-sm font-medium">{user?.name}</span>
              </div>
              <button 
                onClick={logout} 
                className="text-slate-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Log out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Projects</h2>
            <p className="text-slate-500 mt-1">Manage and track your active workspaces.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 font-semibold text-sm transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PlusCircle className="w-5 h-5" />
            New Project
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse bg-white/50 p-6 rounded-2xl shadow-sm border border-slate-100 h-48 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-6 bg-slate-200 rounded-md w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                </div>
                <div className="flex justify-between mt-6">
                   <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                   <div className="h-3 bg-slate-200 rounded-md w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
           <div className="bg-red-50/50 backdrop-blur-sm p-6 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                 <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-red-800 font-semibold text-lg">Failed to load projects</h3>
              <p className="text-red-500 text-sm mt-1">Please try refreshing the page.</p>
           </div>
        ) : data?.data?.length === 0 ? (
           <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300 shadow-sm">
             <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-100 to-violet-100 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 transform rotate-3">
               <Folder className="w-8 h-8" />
             </div>
             <h3 className="mt-2 text-lg font-bold text-slate-900">No projects yet</h3>
             <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">Get started by creating a new project to organize your tasks and collaborate with your team.</p>
             <button
               onClick={() => setModalOpen(true)}
               className="mt-6 text-indigo-600 font-semibold hover:text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors border border-indigo-200 inline-flex items-center"
             >
               Create your first project &rarr;
             </button>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((project) => {
                const isOwner = project.owner_id === user?.id;
                
                return (
                  <Link 
                    key={project.id} 
                    to={`/project/${project.id}`}
                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col hover:-translate-y-1 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {project.name}
                      </h3>
                      <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${isOwner ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10' : 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10'}`}>
                        {isOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-6 flex-1">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4 mt-auto">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-2 py-1 rounded-md text-slate-600">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{project._count?.members || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-2 py-1 rounded-md text-slate-600">
                          <CheckSquare className="w-3.5 h-3.5 text-violet-400" />
                          <span>{project._count?.tasks || 0}</span>
                        </div>
                      </div>
                      <div className="font-medium">
                        {format(new Date(project.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-200 disabled:opacity-50 text-sm font-semibold hover:bg-slate-50 hover:shadow text-slate-700 transition-all"
                >
                  Previous
                </button>
                <div className="bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700">
                  <span className="text-slate-400">Page</span> {page} <span className="text-slate-400">of</span> {data.pagination.totalPages}
                </div>
                <button 
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-200 disabled:opacity-50 text-sm font-semibold hover:bg-slate-50 hover:shadow text-slate-700 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create New Project</h3>
            </div>
            <form onSubmit={formik.handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full rounded-xl border ${formik.touched.name && formik.errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-slate-50'} px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-white`}
                    placeholder="e.g., Marketing Campaign Q4"
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 pl-1">{formik.errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (Optional)</label>
                  <textarea
                    name="description"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none bg-slate-50 hover:bg-white"
                    placeholder="Briefly describe the project goals..."
                  />
                  {formik.touched.description && formik.errors.description && (
                    <p className="mt-1.5 text-xs font-medium text-red-500 pl-1">{formik.errors.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    formik.resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-md disabled:opacity-50 transition-all transform active:scale-95"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
