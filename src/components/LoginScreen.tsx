import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types/task';
import { INITIAL_TEAM_MEMBERS } from '../store/taskStore';
import { Sparkles, Shield, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onOpenArchitecture: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onOpenArchitecture }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('••••••••');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleDemoLogin = (memberId: string) => {
    const member = INITIAL_TEAM_MEMBERS.find((m) => m.id === memberId) || INITIAL_TEAM_MEMBERS[0];
    const role: UserRole = member.id === 'mem_2' ? 'manager' : 'user';
    const profile: UserProfile = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: role,
      avatar: member.avatar,
      title: member.role,
    };
    onLoginSuccess(profile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (selectedRole === 'manager' ? 'Alex Rivera' : 'Sarah Chen');
    const finalEmail = email.trim() || (selectedRole === 'manager' ? 'manager@taskgenie.app' : 'user@taskgenie.app');

    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: finalName,
      email: finalEmail,
      role: selectedRole,
      avatar:
        selectedRole === 'manager'
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      title: selectedRole === 'manager' ? 'Operations Manager' : 'Task Specialist',
    };
    onLoginSuccess(profile);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-y-auto">
      {/* Top Branding Section */}
      <div className="pt-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/25 mb-3">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Task Genie
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] mx-auto">
          Context Diagram & Level 1 DFD Task Manager with AI Subtask Division
        </p>

        {/* System Architecture reference pill button */}
        <button
          onClick={onOpenArchitecture}
          className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 rounded-full border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
        >
          <span>Context Diagram & DFD specs</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Login Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 my-4">
        {/* Role Segmented Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setSelectedRole('user')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'user'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>User Login</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('manager')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'manager'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manager Login</span>
          </button>
        </div>

        {/* Quick Demo Login Option (Recommended for immediate testing) */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            One-Tap Profile Sign In
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('mem_1')}
              className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/70 transition-all text-left flex flex-col items-start group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                  Sarah Chen
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">User Role (Tasks & FM)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('mem_2')}
              className="p-2.5 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/30 hover:bg-violet-100/70 transition-all text-left flex flex-col items-start group"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600">
                  Alex Rivera
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Manager (Work Plot)</span>
            </button>
          </div>
        </div>

        <div className="relative my-3 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <span className="relative px-2 bg-white dark:bg-slate-900 text-[10px] uppercase font-bold text-slate-400">
            or enter credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegistering && (
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder={selectedRole === 'manager' ? 'e.g. Alex Rivera' : 'e.g. Sarah Chen'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder={selectedRole === 'manager' ? 'manager@taskgenie.app' : 'user@taskgenie.app'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-medium text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{isRegistering ? 'Create Account & Enter' : `Sign In as ${selectedRole === 'manager' ? 'Manager' : 'User'}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'New team member? Register profile'}
          </button>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="text-center text-[10px] text-slate-400 pb-2">
        <span>Task Genie v1.0 · Context Diagram Level 0 & Level 1 Compliant</span>
      </div>
    </div>
  );
};
