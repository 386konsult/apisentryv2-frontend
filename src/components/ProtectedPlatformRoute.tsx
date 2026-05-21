import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '@/contexts/PlatformContext';
import { ShieldOff, LayoutGrid, Lock } from 'lucide-react';

// ── Shared empty-state card ────────────────────────────────────────────────────
const WorkspaceGate = ({
  icon,
  title,
  message,
  onAction,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onAction: () => void;
  actionLabel: string;
}) => (
  <div className="flex min-h-[60vh] w-full items-center justify-center px-6">
    <div className="flex flex-col items-center text-center max-w-sm">
      {/* Icon bubble */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
        {icon}
      </div>

      {/* Text */}
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{message}</p>

      {/* CTA */}
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all duration-150"
      >
        <LayoutGrid className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  </div>
);

// ── Route guard ────────────────────────────────────────────────────────────────
const ProtectedPlatformRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { hasSelectedPlatform, isPlatformAccessible, selectedPlatformName } = usePlatform();
  const navigate = useNavigate();

  const goToWorkspaces = () => navigate('/platforms');

  // ① No workspace selected at all
  if (!hasSelectedPlatform) {
    if (fallback) return <>{fallback}</>;
    return (
      <WorkspaceGate
        icon={<LayoutGrid className="h-7 w-7 text-blue-600 dark:text-blue-400" />}
        title="No workspace selected"
        message="You haven't selected a workspace yet. Head over to your workspaces, pick one, and you'll be all set."
        onAction={goToWorkspaces}
        actionLabel="Go to Workspaces"
      />
    );
  }

  // ② Still verifying access — show nothing to avoid a flash
  if (isPlatformAccessible === null) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Verifying workspace access…</p>
        </div>
      </div>
    );
  }

  // ③ Platform selected but user has no access
  if (isPlatformAccessible === false) {
    if (fallback) return <>{fallback}</>;
    return (
      <WorkspaceGate
        icon={<Lock className="h-7 w-7 text-blue-600 dark:text-blue-400" />}
        title="Workspace not accessible"
        message={
          selectedPlatformName
            ? `You no longer have access to "${selectedPlatformName}". You may have been removed, or the workspace may belong to a different account. Please select one of your own workspaces.`
            : "You don't have access to the selected workspace. You may have been removed, or it may belong to a different account. Please select one of your own workspaces."
        }
        onAction={goToWorkspaces}
        actionLabel="Select a Workspace"
      />
    );
  }

  // ④ All good — render the page
  return <>{children}</>;
};

export default ProtectedPlatformRoute;
