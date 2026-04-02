

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProject, useTasks, useTriggerExport, useExportStatus } from '@/hooks/useData';
import { KanbanBoard } from '@/components/KanbanBoard';
import { Users, FileDown, PlusCircle, Filter, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { AddTaskModal } from '@/components/AddTaskModal';
import ProjectMembersModal from '@/components/ProjectMembersModal';

export default function ProjectPage() {
  const { id } = useParams();
  const projectId = id as string;

  const [priorityFilter, setPriorityFilter] = useState('');
  
  const { data: project, isLoading: pdLoading, isError: pdError } = useProject(projectId);
  const { data: tasks, isLoading: tkLoading } = useTasks(projectId, { priority: priorityFilter || undefined });
  
  const exportMutation = useTriggerExport();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [exportId, setExportId] = useState<string | null>(null);
  
  // Use export polling
  const { data: exportData } = useExportStatus(exportId);

  // Poll feedback
  useEffect(() => {
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-4">
                 <Link 
                   to="/dashboard" 
                   className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-semibold text-sm bg-slate-100 hover:bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm"
                 >
                   <ArrowLeft className="w-4 h-4" />
                   Dashboard
                 </Link>
                 <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 truncate max-w-[200px] sm:max-w-md">{project.name}</h1>
                 {isOwner && (
                   <span className="shrink-0 bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-700/10 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wide">Owner</span>
                 )}
              </div>
              {project.description && (
                <p className="mt-2 text-sm text-slate-500 max-w-2xl pl-1">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white shadow-sm px-4 py-2 rounded-xl border border-slate-200">
                <div className="flex items-center text-sm font-semibold text-slate-600">
                  <Users className="w-4 h-4 mr-2.5 text-indigo-400" />
                  {project.members?.length || 0} Members
                </div>
                {isOwner && (
                  <button 
                    onClick={() => setIsMembersModalOpen(true)}
                    className="ml-2 p-1.5 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                    title="Manage Members"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {isOwner && (
                 <>
                  {exportData?.status === 'completed' && exportData.file_path ? (
                    <a 
                      href={`http://localhost:4000${exportData.file_path}`} 
                      download 
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:from-indigo-500 hover:to-violet-500 flex items-center gap-2 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                    >
                      <FileDown className="w-4.5 h-4.5" />
                      Download CSV
                    </a>
                  ) : (
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md hover:shadow-lg transform active:scale-95"
                    >
                      <FileDown className="w-4.5 h-4.5" />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm min-w-[200px]">
               <Filter className="w-4.5 h-4.5 text-slate-400 ml-3" />
               <select 
                 value={priorityFilter} 
                 onChange={(e) => setPriorityFilter(e.target.value)}
                 className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 font-semibold py-1.5 px-2 cursor-pointer outline-none w-full"
               >
                 <option value="">All Priorities</option>
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
            </div>
            
            {/* Quick Export History Button */}
            <Link 
              to={`/exports`} 
              className="text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-5 py-2 hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-center rounded-xl whitespace-nowrap shadow-sm transition-all"
            >
              Export History
            </Link>
          </div>

          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 flex items-center gap-2.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 font-semibold text-sm transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            Add Task
          </button>
        </div>

        <AddTaskModal 
          projectId={projectId} 
          project={project}
          isOpen={isTaskModalOpen} 
          onClose={() => setIsTaskModalOpen(false)} 
        />

        <ProjectMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          project={project}
        />

        {/* Kanban Area */}
        {tkLoading ? (
           <div className="flex-1 flex items-center justify-center animate-pulse">
             <div className="flex gap-6 w-full h-[500px]">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex-1 bg-slate-200/50 rounded-2xl"></div>
               ))}
             </div>
           </div>
        ) : (
           <div className="flex-1 min-h-[500px]">
             <KanbanBoard projectId={projectId} project={project} tasks={tasks || []} />
           </div>
        )}
      </main>
    </div>
  );
}
