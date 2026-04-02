import React from 'react';
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { X, UserPlus, Trash2, ShieldCheck, Mail, Users } from 'lucide-react';
import { Project } from '../types/api';
import { useAddMember, useRemoveMember } from '../hooks/useData';

interface ProjectMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const AddMemberSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ProjectMembersModal: React.FC<ProjectMembersModalProps> = ({ isOpen, onClose, project }) => {
  const currentUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const addMemberMutation = useAddMember();
  const removeMemberMutation = useRemoveMember();

  if (!isOpen) return null;

  const isOwner = project.owner_id === currentUser?.id;

  const handleAddMember = async (values: { email: string }, { resetForm }: FormikHelpers<{ email: string }>) => {
    await addMemberMutation.mutateAsync({ projectId: project.id, email: values.email });
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Manage Members</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Add Member Form (Only for Owner) */}
          {isOwner && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Add New Member</h3>
              <Formik
                initialValues={{ email: '' }}
                validationSchema={AddMemberSchema}
                onSubmit={handleAddMember}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail size={16} />
                      </div>
                      <Field
                        name="email"
                        type="email"
                        placeholder="Team member's email"
                        className={`w-full pl-10 pr-4 py-2 bg-gray-50 border ${
                          errors.email && touched.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm`}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs pl-1" />
                    
                    <button
                      type="submit"
                      disabled={isSubmitting || addMemberMutation.isPending}
                      className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2 text-sm"
                    >
                      {addMemberMutation.isPending ? 'Adding...' : (
                        <>
                          <UserPlus size={16} />
                          Invite Member
                        </>
                      )}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Members List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Current Members</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {/* Owner */}
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-200">
                    {project.owner?.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      {project.owner?.name}
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold tracking-tighter ring-1 ring-inset ring-indigo-200">
                        <ShieldCheck size={10} /> Owner
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">{project.owner?.email}</div>
                  </div>
                </div>
              </div>

              {/* Other Members */}
              {project.members && project.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold ring-2 ring-white">
                      {member.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{member.user.name}</div>
                      <div className="text-xs text-gray-500">{member.user.email}</div>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <button
                      onClick={() => removeMemberMutation.mutate({ projectId: project.id, userId: member.user_id })}
                      disabled={removeMemberMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove Member"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {(!project.members || project.members.length === 0) && !isOwner && (
                <div className="text-center py-4 text-gray-400 text-sm italic">
                  No other members in this project.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersModal;
