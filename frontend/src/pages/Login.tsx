

import React, { useState } from 'react';
import { useLogin } from '@/hooks/useAuthContent';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: LoginSchema,
    onSubmit: (values) => {
      loginMutation.mutate(values);
    },
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 overflow-hidden px-4 sm:px-6 lg:px-8 font-sans">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-violet-400 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/50 z-10 transition-all duration-300 transform hover:scale-[1.01]">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-xl flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform mb-6">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors underline decoration-2 underline-offset-4 decoration-indigo-200 hover:decoration-indigo-500">
              Sign up for free
            </Link>
          </p>
        </div>
        
        <form className="mt-10 space-y-5" onSubmit={formik.handleSubmit}>
          <div className="space-y-4">
            <div className="relative group">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 transition-colors ${formik.errors.email && formik.touched.email ? 'text-red-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  className={`block w-full pl-11 pr-4 py-3.5 rounded-2xl border-0 bg-white/50 text-slate-900 shadow-sm ring-1 ring-inset transition-all duration-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                    formik.errors.email && formik.touched.email 
                      ? 'ring-red-300 focus:ring-red-500' 
                      : 'ring-slate-200 focus:ring-indigo-600 hover:bg-white'
                  }`}
                  placeholder="name@company.com"
                  {...formik.getFieldProps('email')}
                />
              </div>
              {formik.errors.email && formik.touched.email && (
                <div className="mt-1 ml-1 text-xs font-bold text-red-500 animate-in fade-in slide-in-from-left-1">{formik.errors.email}</div>
              )}
            </div>

            <div className="relative group">
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors ${formik.errors.password && formik.touched.password ? 'text-red-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full pl-11 pr-12 py-3.5 rounded-2xl border-0 bg-white/50 text-slate-900 shadow-sm ring-1 ring-inset transition-all duration-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
                    formik.errors.password && formik.touched.password 
                      ? 'ring-red-300 focus:ring-red-500' 
                      : 'ring-slate-200 focus:ring-indigo-600 hover:bg-white'
                  }`}
                  placeholder="••••••••"
                  {...formik.getFieldProps('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {formik.errors.password && formik.touched.password && (
                <div className="mt-1 ml-1 text-xs font-bold text-red-500 animate-in fade-in slide-in-from-left-1">{formik.errors.password}</div>
              )}
            </div>
          </div>

          {loginMutation.isError && (
            <div className="animate-in fade-in slide-in-from-top-2 text-red-600 text-xs font-bold bg-red-50/80 backdrop-blur-sm p-4 rounded-2xl border border-red-200 flex items-center gap-3">
              <div className="bg-red-500 text-white rounded-full p-1">
                 <Lock className="w-3 h-3" />
              </div>
              <span>{(loginMutation.error as any)?.response?.data?.error?.message || 'Invalid credentials or server error'}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative flex w-full justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-sm font-bold text-white shadow-lg hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transform transition-all active:scale-[0.97] shadow-indigo-500/20"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  Authenticating...
                </span>
              ) : (
                'Sign in to Dashboard'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
