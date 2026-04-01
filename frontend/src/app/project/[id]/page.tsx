'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProject, useTasks, useTriggerExport, useExportStatus } from '@/hooks/useData';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LayoutDashboard, Users, FileDown, PlusCircle, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProjectPage() {
  const { id } = useParams();
  const projectId = id as string;

  const [priorityFilter, setPriorityFilter] = useState('');
  
  const { data: project, isLoading: pdLoading, isError: pdError } = useProject(projectId);
  const { data: tasks, isLoading: tkLoading } = useTasks(projectId, { priority: priorityFilter || undefined });
  
  const exportMutation = useTriggerExport();
  const [exportId, setExportId] = useState<string | null>(null);
  
  // Use export polling
  const { data: exportData } = useExportStatus(exportId);

  // Poll feedback
  React.useEffect(() => {
    if (exportData?.status === 'completed' && exportData.file_path) {
       toast.success('Export completed! File ready for download.');
       // Optionally stop polling by wiping exportId or conditionally rendering a download link
    }
    if (exportData?.status === 'failed') {
       toast.error('Export failed on the server.');
    }
  }, [exportData?.status]);

  const handleExport = async () => {
    try {
      const response = await exportMutation.mutateAsync(projectId);
      setExportId(response.exportId);
      toast.success('Export queued! Generating CSV...');
    } catch (err) {
      toast.error('Could not queue export request.');
    }
  };

  if (pdLoading) return <div className="min-h-screen flex items-center justify-center">Loading project...</div>;
  if (pdError || !project) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading project or you do not have permission.</div>;

  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isOwner = project.owner_id === user?.id;

  const isExporting = exportData?.status === 'pending' || exportData?.status === 'processing';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                 <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
                   <LayoutDashboard className="w-5 h-5" />
                 </Link>
                 <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                 {isOwner && (
                   <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-medium">Owner</span>
                 )}
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-gray-500 max-w-2xl">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <Users className="w-4 h-4 mr-2" />
                {project.members?.length || 0} Members
              </div>
              
              {isOwner && (
                 <>
                  {exportData?.status === 'completed' && exportData.file_path ? (
                    <a 
                      href={`http://localhost:4000${exportData.file_path}`} 
                      download 
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      Download CSV
                    </a>
                  ) : (
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                      {isExporting ? 'Exporting...' : 'Export Project'}
                    </button>
                  )}
                 </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm min-w-[200px]">
               <Filter className="w-4 h-4 text-gray-400 ml-2" />
               <select 
                 value={priorityFilter} 
                 onChange={(e) => setPriorityFilter(e.target.value)}
                 className="bg-transparent border-none text-sm focus:ring-0 text-gray-700 font-medium py-1 px-2 cursor-pointer outline-none w-full"
               >
                 <option value="">All Priorities</option>
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
            </div>
            
            {/* Quick Export History Button */}
            <Link 
              href={`/exports`} 
              className="text-sm font-medium text-gray-600 bg-white border border-gray-200 px-4 py-2 hover:bg-gray-50 flex rounded-lg whitespace-nowrap"
            >
              Export History
            </Link>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm w-full sm:w-auto justify-center">
            <PlusCircle className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Kanban Area */}
        {tkLoading ? (
           <div className="flex-1 flex items-center justify-center">Loading board...</div>
        ) : (
           <div className="flex-1 min-h-[500px]">
             <KanbanBoard projectId={projectId} tasks={tasks || []} />
           </div>
        )}
      </main>
    </div>
  );
}
