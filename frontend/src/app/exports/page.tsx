'use client';

import React from 'react';
import { useExportHistory } from '@/hooks/useData';
import { LayoutDashboard, FileDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ExportsPage() {
  const { data, isLoading, isError } = useExportHistory();

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-8">
           <Link href="/dashboard" className="text-gray-400 border border-gray-200 p-2 rounded-md bg-white hover:text-gray-600 transition-colors">
             <LayoutDashboard className="w-5 h-5" />
           </Link>
           <h1 className="text-2xl font-bold text-gray-900">Your Export History</h1>
        </div>

        {isLoading ? (
          <div className="animate-pulse bg-white h-64 rounded-xl border border-gray-200 shadow-sm" />
        ) : isError ? (
          <div className="text-red-500 bg-white p-6 rounded-xl border border-red-200 shadow-sm">Failed to load exports.</div>
        ) : data?.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
            <FileDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">No export jobs</h3>
            <p className="text-sm text-gray-500 mt-1">You haven't requested any project exports yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <ul className="divide-y divide-gray-200">
               {data?.map(exp => (
                 <li key={exp.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                   <div className="flex items-start gap-4">
                     <div className="mt-1">
                       {exp.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                       {exp.status === 'pending' || exp.status === 'processing' ? <Clock className="w-5 h-5 text-yellow-500 animate-pulse" /> : null}
                       {exp.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                     </div>
                     <div>
                       <p className="font-semibold text-gray-900 text-sm">Export ID: {exp.id}</p>
                       <p className="text-xs text-gray-500 mt-1">Requested {format(new Date(exp.created_at || new Date()), 'PPpp')}</p>
                       <p className="text-xs text-gray-500 mt-0.5">Project ID: {exp.project_id}</p>
                     </div>
                   </div>

                   <div>
                     {exp.status === 'completed' && exp.file_path && (
                       <a
                         href={`http://localhost:4000${exp.file_path}`}
                         download
                         className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-100"
                       >
                         <FileDown className="w-4 h-4" />
                         Download File
                       </a>
                     )}
                     {exp.status !== 'completed' && (
                       <span className={`text-xs px-3 py-1 font-bold rounded-full uppercase ${exp.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
