import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Lock, ShieldOff, Mail, User } from 'lucide-react';
import { PlatformOwner } from '@/contexts/PlatformContext';

interface WorkspaceAccessGateProps {
  /** 'no_platform' – nothing selected; 'no_access' – selected but denied */
  variant?: 'no_platform' | 'no_access';
  platformName?: string | null;
  platformOwner?: PlatformOwner | null;
}

const WorkspaceAccessGate: React.FC<WorkspaceAccessGateProps> = ({
  variant = 'no_platform',
  platformName,
  platformOwner,
}) => {
  const navigate = useNavigate();

  if (variant === 'no_platform') {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          {/* Icon */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
            <LayoutGrid className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            No workspace selected
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
            You haven't selected a workspace yet. Head over to your workspaces, pick one, and you'll be all set.
          </p>

          <button
            onClick={() => navigate('/platforms')}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150"
          >
            <LayoutGrid className="h-4 w-4" />
            Go to Workspaces
          </button>
        </div>
      </div>
    );
  }

  // variant === 'no_access'
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center px-6">
      <div className="flex flex-col items-center text-center max-w-sm w-full">
        {/* Icon */}
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-500/10 ring-1 ring-red-100 dark:ring-red-500/20">
          <Lock className="h-7 w-7 text-red-500 dark:text-red-400" />
        </div>

        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Workspace not accessible
        </h2>

        {platformName ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            You don't have access to{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              "{platformName}"
            </span>
            . You may have been removed or this workspace belongs to a different account.
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            You don't have access to the selected workspace. You may have been removed or it belongs to a different account.
          </p>
        )}

        {/* Owner card */}
        {platformOwner && (
          <div className="w-full mb-6 rounded-[14px] border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              Workspace owner
            </p>
            <div className="flex flex-col gap-1.5">
              {platformOwner.name && platformOwner.name !== platformOwner.email && (
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <User className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="font-medium">{platformOwner.name}</span>
                </div>
              )}
              {platformOwner.email && (
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{platformOwner.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!platformOwner && <div className="mb-6" />}

        <button
          onClick={() => navigate('/platforms')}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150"
        >
          <LayoutGrid className="h-4 w-4" />
          Select a Workspace
        </button>
      </div>
    </div>
  );
};

export default WorkspaceAccessGate;
