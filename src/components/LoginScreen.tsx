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
    const role: UserRole = member.role === 'Project Manager' ? 'manager' : 'user';
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
    const defaultMember =
      selectedRole === 'manager'
        ? INITIAL_TEAM_MEMBERS.find((m) => m.role === 'Project Manager') || INITIAL_TEAM_MEMBERS[2]
        : INITIAL_TEAM_MEMBERS[0];
    const finalName = name.trim() || defaultMember.name;
    const finalEmail = email.trim() || defaultMember.email;

    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: finalName,
      email: finalEmail,
      role: selectedRole,
      avatar: defaultMember.avatar,
      title: selectedRole === 'manager' ? 'Project Manager' : 'Project Analyst',
    };
    onLoginSuccess(profile);
  };

  return (
    <div
      className={`flex-1 w-full h-full flex flex-col justify-between p-6 overflow-y-auto transition-colors duration-300 ${
        selectedRole === 'manager'
          ? 'bg-gradient-to-b from-teal-950/15 via-slate-50 to-teal-50/40 dark:from-black dark:via-teal-950/30 dark:to-black'
          : 'bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 dark:from-black dark:via-zinc-950 dark:to-black'
      }`}
    >
      {/* Top Branding Section */}
      <div className="pt-4 text-center">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-lg border mb-3 transition-colors ${
            selectedRole === 'manager'
              ? 'bg-gradient-to-tr from-teal-950 to-teal-800 border-teal-700'
              : 'bg-gradient-to-tr from-indigo-700 to-indigo-500 border-indigo-400/50'
          }`}
        >
          <Sparkles className={`w-8 h-8 ${selectedRole === 'manager' ? 'text-amber-300' : 'text-white'}`} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Task Genie
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-[260px] mx-auto">
          Context Diagram & Level 1 DFD Task Manager with AI Subtask Division
        </p>

        {/* System Architecture reference pill button */}
        <button
          onClick={onOpenArchitecture}
          className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-900 rounded-full border border-slate-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <span>Context Diagram & DFD specs</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Main Login Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-zinc-800 my-4">
        {/* Role Segmented Selector */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-black rounded-xl mb-3 text-xs font-medium border border-transparent dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setSelectedRole('user')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              selectedRole === 'user'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
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
                ? 'bg-teal-800 dark:bg-teal-700 text-amber-200 shadow-sm font-semibold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Manager Login</span>
          </button>
        </div>

        {/* Role Interface Preview Strip */}
        <div
          className={`p-2.5 rounded-xl border text-[11px] mb-4 transition-colors ${
            selectedRole === 'manager'
              ? 'bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 text-teal-50 border-teal-800'
              : 'bg-indigo-50/80 dark:bg-indigo-950/30 text-slate-700 dark:text-zinc-300 border-indigo-200/80 dark:border-indigo-800/50'
          }`}
        >
          {selectedRole === 'manager' ? (
            <p className="leading-snug">
              <strong className="text-amber-300">Manager Command Hub (Teal Executive Theme):</strong> Delegate work across team, review Accept/Reject responses, balance Work Plot capacity, and inspect team PDF reports.
            </p>
          ) : (
            <p className="leading-snug">
              <strong className="text-indigo-700 dark:text-indigo-300">User Focus Workspace (Indigo Personal Theme):</strong> Manage your assigned queue, set a Daily Goal, run Focus FM sessions, and respond to manager tasks.
            </p>
          )}
        </div>

        {/* Quick Demo Login Option Filtered by Selected Role */}
        <div className="mb-4">
          <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-2">
            {selectedRole === 'manager' ? 'Manager Profile Sign In' : 'One-Tap User Sign In'}
          </label>
          {selectedRole === 'manager' ? (
            <button
              type="button"
              onClick={() => handleDemoLogin('mem_3')}
              className="w-full p-3 rounded-xl border border-teal-800 bg-gradient-to-r from-teal-950 to-teal-900 hover:from-teal-900 hover:to-teal-800 text-white transition-all text-left flex items-center justify-between gap-2 shadow-sm"
            >
              <div>
                <p className="text-xs font-bold text-white">Saniya Firdaush</p>
                <p className="text-[10px] text-amber-300/90">Project Manager · Full Team Delegation Access</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {INITIAL_TEAM_MEMBERS.filter((m) => m.role !== 'Project Manager').map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleDemoLogin(member.id)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-left flex flex-col items-start"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate w-full">
                    {member.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate w-full">
                    {member.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative my-3 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-zinc-800"></div>
          </div>
          <span className="relative px-2 bg-white dark:bg-zinc-900 text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">
            or enter credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegistering && (
            <div>
              <label className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder={selectedRole === 'manager' ? 'e.g. Saniya Firdaush' : 'e.g. Jyoti Kumari'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder={selectedRole === 'manager' ? 'manager@taskgenie.app' : 'user@taskgenie.app'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className={`w-full mt-2 py-2.5 px-4 active:scale-[0.99] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 border ${
              selectedRole === 'manager'
                ? 'bg-teal-800 hover:bg-teal-900 dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-zinc-950 text-white border-teal-700 dark:border-transparent'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white border-indigo-500 dark:border-transparent'
            }`}
          >
            <span>{isRegistering ? 'Create Account & Enter' : `Sign In as ${selectedRole === 'manager' ? 'Manager' : 'User'}`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[11px] text-slate-600 dark:text-zinc-400 hover:underline"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'New team member? Register profile'}
          </button>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="text-center text-[10px] text-slate-400 dark:text-zinc-500 pb-2">
        <span>Task Genie v1.0 · Context Diagram Level 0 & Level 1 Compliant</span>
      </div>
    </div>
  );
};
