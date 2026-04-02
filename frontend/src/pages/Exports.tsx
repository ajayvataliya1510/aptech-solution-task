

import React from 'react';
import { useExportHistory } from '@/hooks/useData';
import { LayoutDashboard, FileDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function ExportsPage() {
  const { data, isLoading, isError } = useExportHistory();

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-10">
           <Link to="/dashboard" className="text-slate-400 border border-slate-200 p-2 rounded-xl bg-white hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm">
             <LayoutDashboard className="w-5 h-5" />
           </Link>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">Your Export History</h1>
        </div>

        {isLoading ? (
          <div className="animate-pulse bg-white/60 h-64 rounded-3xl border border-slate-200 shadow-sm" />
        ) : isError ? (
          <div className="text-red-500 bg-red-50/50 backdrop-blur-sm p-6 rounded-2xl border border-red-200 shadow-sm text-center font-medium">Failed to load exports.</div>
        ) : data?.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm px-6 py-16 text-center rounded-3xl border border-dashed border-slate-300 shadow-sm">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
               <FileDown className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">No export jobs</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">You haven't requested any project exports yet. Go to a project and click "Export Project" to generate one.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
             <ul className="divide-y divide-slate-100">
               {data?.map(exp => (
                 <li key={exp.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-colors gap-4">
                   <div className="flex items-start gap-5">
                     <div className="relative mt-1">
                       {exp.status === 'completed' && <div className="absolute inset-0 bg-emerald-400 blur opacity-40 rounded-full"></div>}
                       {exp.status === 'completed' && <CheckCircle className="w-6 h-6 text-emerald-500 relative z-10" />}
                       
                       {(exp.status === 'pending' || exp.status === 'processing') && <div className="absolute inset-0 bg-amber-400 blur opacity-40 rounded-full animate-pulse"></div>}
                       {exp.status === 'pending' || exp.status === 'processing' ? <Clock className="w-6 h-6 text-amber-500 relative z-10 animate-pulse" /> : null}
                       
                       {exp.status === 'failed' && <XCircle className="w-6 h-6 text-rose-500 relative z-10" />}
                     </div>
                     <div>
                       <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          Export ID
                          <span className="bg-slate-100 text-slate-500 font-mono text-[10px] px-2 py-0.5 rounded">{exp.id.slice(0, 8)}...</span>
                       </p>
                       <p className="text-xs text-slate-500 mt-1.5 font-medium">Requested {format(new Date((exp as any).created_at || new Date()), 'MMM d, yyyy \u2022 h:mm a')}</p>
                       <div className="bg-slate-50 inline-block px-2.5 py-1 rounded-md text-[10px] text-slate-500 font-semibold mt-2 border border-slate-100">Project: {exp.project_id}</div>
                     </div>
                   </div>

                   <div className="flex items-center sm:justify-end ml-11 sm:ml-0">
                     {exp.status === 'completed' && exp.file_path && (
                       <a
                         href={`http://localhost:4000${exp.file_path}`}
                         download
                         className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl transition-all border border-indigo-100 shadow-sm hover:shadow"
                       >
                         <FileDown className="w-4.5 h-4.5" />
                         Download CSV
                       </a>
                     )}
                     {exp.status !== 'completed' && (
                       <span className={`text-[11px] px-3.5 py-1.5 font-bold rounded-lg uppercase tracking-wider ${exp.status === 'failed' ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'}`}>
                         {exp.status}
                       </span>
                     )}
                   </div>
                 </li>
               ))}
             </ul>
          </div>
        )}
      </div>
    </div>
  );
}
