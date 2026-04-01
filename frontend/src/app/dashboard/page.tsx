'use client';

import React, { useState } from 'react';
import { useProjects, useCreateProject } from '@/hooks/useData';
import { logout } from '@/hooks/useAuthContent';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlusCircle, LogOut, Folder, Users, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useProjects(page, 10);
  const createMutation = useCreateProject();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = currentUserStr ? JSON.parse(currentUserStr) : null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(newProject);
      toast.success('Project created successfully!');
      setModalOpen(false);
      setNewProject({ name: '', description: '' });
    } catch (err) {
      toast.error('Failed to create project.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Folder className="w-6 h-6 text-blue-600" />
              Aptech Task Manager
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 text-sm hidden sm:block">Welcome, {user?.name}</span>
              <button 
                onClick={logout} 
                className="text-gray-500 hover:text-red-600 p-2 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            New Project
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-40"></div>
            ))}
          </div>
        ) : isError ? (
           <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">Error loading projects.</div>
        ) : data?.data?.length === 0 ? (
           <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
             <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects yet</h3>
             <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
           </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.data.map((project) => {
                const isOwner = project.owner_id === user?.id;
                
                return (
                  <Link 
                    key={project.id} 
                    href={`/project/${project.id}`}
                    className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all block"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate pr-2">
                        {project.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${isOwner ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {isOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">
                      {project.description || 'No description provided.'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4 mt-auto">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{project._count?.members || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckSquare className="w-4 h-4" />
                        <span>{project._count?.tasks || 0} tasks</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-3 font-medium">
                      Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded bg-white border border-gray-200 disabled:opacity-50 text-sm font-medium hover:bg-gray-50 text-gray-700"
                >
                  Previous
                </button>
                <span className="px-4 py-1 flex items-center text-sm font-medium text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button 
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 rounded bg-white border border-gray-200 disabled:opacity-50 text-sm font-medium hover:bg-gray-50 text-gray-700"
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
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Create New Project</h3>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Marketing Campaign Q4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Briefly describe the project goals..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm disabled:opacity-50"
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
