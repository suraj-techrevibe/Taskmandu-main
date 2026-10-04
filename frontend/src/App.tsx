import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Role, AuthUser } from './types';
import { APP_ROUTES, resolveRouteTitle, routeByTab } from './constants/routes';
import { todayStr } from './utils/date';
import { useWorkspaceData } from './hooks/useWorkspaceData';
import { useDocumentTitle } from './hooks/useDocumentTitle';

import AuthModule from './features/auth/AuthModule';
import ResetPasswordModule from './features/auth/ResetPasswordModule';
import TeamModule from './features/team/TeamModule';
import RolesModule from './features/roles/RolesModule';
import PermissionsCatalog from './features/roles/PermissionsCatalog';
import InviteAcceptModule from './features/invite/InviteAcceptModule';
import RosterModule from './features/roster/RosterModule';
import AttendanceModule from './features/attendance/AttendanceModule';
import DepartmentModule from './features/departments/DepartmentModule';
import OnboardingModule from './features/onboarding/OnboardingModule';
import OnboardingDecisionModule from './features/onboarding/OnboardingDecisionModule';
import OffboardingModule from './features/offboarding/OffboardingModule';
import ProjectListPage from './features/project/ProjectListPage';
import ProjectBoardPage from './features/project/ProjectBoardPage';
import ProjectsModule from './features/project/ProjectsModule';
import TaskDetailPage from './features/project/TaskDetailPage';
import DashboardModule from './features/dashboard/DashboardModule';
import RecruitmentModule from './features/recruitment/RecruitmentModule';
import ReportsModule from './features/report/ReportsModule';
import LeaveModule from './features/leave/LeaveModule';
import NotesModule from './features/notes/NotesModule';
import ChatModule from './features/chat/ChatModule';
import ToastHost from './components/ToastHost';
import ChangePasswordModal from './components/ChangePasswordModal';
import InviteModalWithRoles from './components/InviteModalWithRoles';
import PermissionGate from './components/PermissionGate';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

import { clearSession, getStoredUser, logout as apiLogout, me, updateStoredUser } from './services/auth';
import { AUTH_EXPIRED_EVENT, getAccessToken } from './services/http';
import { toast } from './services/toast';
import { Shield, Sparkles } from 'lucide-react';
import ProfileModule from './features/profile/ProfileModule';

export default function App() {
  // Session / Authentication state variables
  const [sessionStatus, setSessionStatus] = useState<'restoring' | 'authenticated' | 'unauthenticated'>(
    'restoring',
  );
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [currentRole, setCurrentRole] = useState<Role>(() => getStoredUser()?.role ?? 'Super Admin');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Per-route document title (must run before early returns)
  const pageTitle = resolveRouteTitle(location.pathname);
  const matchedRoute = APP_ROUTES.find(
    (r) => location.pathname === r.path || location.pathname.startsWith(`${r.path}/`),
  );
  useDocumentTitle(pageTitle ?? matchedRoute?.label ?? null);

  // All workspace data + CRUD handlers live in this hook
  const workspace = useWorkspaceData(
    sessionStatus === 'authenticated',
    currentUser?.permissions ?? [],
  );

  const handleSidebarNav = (tabId: string) => {
    navigate(routeByTab[tabId]?.path ?? '/dashboard');
    if (window.innerWidth < 1024) setIsSidebarExpanded(false);
  };

  const showToast = (message: string, duration = 2500) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), duration);
  };

  // Authenticate Success Callback
  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setSessionStatus('authenticated');

    if (!user.permissions?.includes('dashboard:view')) {
      navigate('/attendance');
    } else {
      navigate('/dashboard');
    }
  };

  // Restore persisted session on boot (validates access token, refreshes if needed)
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      if (!getAccessToken()) {
        if (!cancelled) setSessionStatus('unauthenticated');
        return;
      }
      try {
        const user = await me();
        if (cancelled) return;
        setCurrentUser(user);
        setCurrentRole(user.role);
        setSessionStatus('authenticated');
      } catch {
        clearSession();
        if (!cancelled) {
          setCurrentUser(null);
          setSessionStatus('unauthenticated');
        }
      }
    };

    void restoreSession();

    const onAuthExpired = () => {
      clearSession();
      setCurrentUser(null);
      setCurrentRole('Super Admin');
      setSessionStatus('unauthenticated');
      toast.error('Your session has expired. Please sign in again.');
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    };
  }, []);

  // Sign out / Log out trigger
  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('wms_refresh_token');
    await apiLogout(refreshToken);
    clearSession();
    setCurrentUser(null);
    setCurrentRole('Super Admin');
    setSessionStatus('unauthenticated');
    navigate('/');
    toast.info('You have been signed out.');
  };

  const resetMatch = location.pathname.match(/^\/reset-password\/([a-f0-9]{64})$/);
  if (resetMatch) {
    const proceedToLogin = () => {
      setSessionStatus('unauthenticated');
      navigate('/', { replace: true });
    };
    return (
      <>
        <ResetPasswordModule token={resetMatch[1]} onProceedToLogin={proceedToLogin} />
        <ToastHost />
      </>
    );
  }

  // Public invitation accept/reject screen (e.g. /invite/<token>)
  const inviteMatch = location.pathname.match(/^\/invite\/([a-f0-9]{64})$/);
  if (inviteMatch) {
    const proceedToLogin = () => {
      window.history.replaceState({}, '', '/');
      if (getAccessToken()) {
        setSessionStatus('authenticated');
        navigate('/dashboard');
      } else {
        setSessionStatus('unauthenticated');
      }
    };
    return (
      <>
        <InviteAcceptModule token={inviteMatch[1]} onProceedToLogin={proceedToLogin} />
        <ToastHost />
      </>
    );
  }

  // Public onboarding decision screen (accept) e.g. /onboarding/decision/<token>
  const onboardingDecisionMatch = location.pathname.match(/^\/onboarding\/decision\/([a-f0-9]{64})$/);
  if (onboardingDecisionMatch) {
    const proceedToLogin = () => {
      window.history.replaceState({}, '', '/');
      if (getAccessToken()) {
        setSessionStatus('authenticated');
        navigate('/dashboard');
      } else {
        setSessionStatus('unauthenticated');
      }
    };
    return (
      <>
        <OnboardingDecisionModule
          token={onboardingDecisionMatch[1]}
          onProceedToLogin={proceedToLogin}
        />
        <ToastHost />
      </>
    );
  }

  if (sessionStatus === 'restoring') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center gap-4 p-4">
        <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 animate-pulse">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Taskmandu</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Restoring your session…
          </p>
        </div>
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthModule onLoginSuccess={handleLoginSuccess} />
        </div>
        <ToastHost />
      </div>
    );
  }

  const currentUserNonNull = currentUser!;

  // Permission set driving sidebar visibility
  const effectivePermissions: string[] = currentUserNonNull.permissions ?? [];

  // Current route (tab) derived from the URL path
  const activeTab = APP_ROUTES.find(
    (r) => location.pathname === r.path || location.pathname.startsWith(`${r.path}/`),
  )?.id ?? 'dashboard';
  const activeTabLabel = routeByTab[activeTab]?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans">
      {/* Primary Navigation Shell */}
      <div className="flex-1 flex flex-col lg:flex-row lg:items-stretch">
        <Sidebar
          expanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded((prev) => !prev)}
          onNavigate={handleSidebarNav}
          activeTab={activeTab}
          permissions={effectivePermissions}
          user={currentUserNonNull}
          employees={workspace.employees}
          onLogout={() => void handleLogout()}
          onChangePassword={() => setShowChangePassword(true)}
          onToast={showToast}
        />

        {/* Content Panel Area - Pristine Light Theme Style */}
        <div className="flex-1 bg-[#F9F9FB] px-0 lg:px-8 pt-0 lg:pt-8 pb-5 lg:pb-8 space-y-6 overflow-y-auto">
          <Topbar
            title={activeTabLabel}
            onToggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
            notifications={workspace.notifications}
            onMarkAllRead={workspace.handleMarkAllNotsRead}
            onClearAll={workspace.handleClearAllNots}
            onNavigateChat={() => navigate('/chat')}
            canInvite={effectivePermissions.includes('users:invite')}
            onInvite={() => setShowInviteModal(true)}
            onToast={showToast}
          />

          {/* Module Router View */}
          <div className="animate-fadeIn">
            <Routes>
              <Route
                path="/profile"
                element={
                  <ProfileModule
                    user={currentUserNonNull}
                    employees={workspace.employees}
                    onUserUpdated={(user) => {
                      setCurrentUser(user);
                      setCurrentRole(user.role);
                      updateStoredUser(user);
                    }}
                  />
                }
              />

              <Route
                path="/dashboard"
                element={
                  <PermissionGate permissions={['dashboard:view']} effectivePermissions={effectivePermissions}>
                    <DashboardModule
                      employees={workspace.employees}
                      rosters={workspace.rosters}
                      attendances={workspace.attendances}
                      tasks={workspace.tasks}
                      currentRole={currentRole}
                      jobApplications={workspace.jobApplications}
                      upcomingInterviews={workspace.upcomingInterviews}
                      leaveRequests={workspace.leaveRequests}
                      currentUserName={currentUserNonNull.name}
                      currentEmployeeId={currentUserNonNull.employeeId}
                      onNavigateTab={(tabId) => navigate(routeByTab[tabId]?.path ?? '/dashboard')}
                      onViewRecruitment={() => navigate('/recruitment')}
                      onCheckIn={workspace.handleCheckIn}
                      onCheckOut={workspace.handleCheckOut}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/recruitment"
                element={
                  <PermissionGate permissions={['recruitment:view']} effectivePermissions={effectivePermissions}>
                    <RecruitmentModule
                      jobApplications={workspace.jobApplications}
                      upcomingInterviews={workspace.upcomingInterviews}
                      jobs={workspace.jobs}
                      currentRole={currentRole}
                      onAddApplication={workspace.handleAddApplication}
                      onUpdateApplication={workspace.handleUpdateApplication}
                      onDeleteApplication={workspace.handleDeleteApplication}
                      onAddInterview={workspace.handleAddInterview}
                      onUpdateInterview={workspace.handleUpdateInterview}
                      onDeleteInterview={workspace.handleDeleteInterview}
                      onAddJob={workspace.handleAddJob}
                      onUpdateJob={workspace.handleUpdateJob}
                      onDeleteJob={workspace.handleDeleteJob}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/roster"
                element={
                  <PermissionGate permissions={['rosters:view']} effectivePermissions={effectivePermissions}>
                    <RosterModule
                      rosters={workspace.rosters}
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentEmployeeId={currentUserNonNull.employeeId}
                      departments={workspace.departments}
                      onAddRoster={workspace.handleAddRoster}
                      onCopyRoster={workspace.handleCopyRoster}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/attendance"
                element={
                  <PermissionGate permissions={['attendance:view']} effectivePermissions={effectivePermissions}>
                    <AttendanceModule
                      attendances={workspace.attendances}
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentEmployeeId={currentUserNonNull.employeeId}
                      todayDate={todayStr()}
                      effectivePermissions={effectivePermissions}
                      onCheckIn={workspace.handleCheckIn}
                      onCheckOut={workspace.handleCheckOut}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/departments"
                element={
                  <PermissionGate permissions={['departments:view']} effectivePermissions={effectivePermissions}>
                    <DepartmentModule
                      canManage={effectivePermissions.includes('departments:manage')}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/leave"
                element={
                  <PermissionGate permissions={['leaves:view']} effectivePermissions={effectivePermissions}>
                    <LeaveModule
                      leaveRequests={workspace.leaveRequests}
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentEmployeeId={currentUserNonNull.employeeId}
                      onAddLeaveRequest={workspace.handleAddLeaveRequest}
                      onActionLeaveRequest={workspace.handleActionLeaveRequest}
                      rosters={workspace.rosters}
                      attendances={workspace.attendances}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/projects"
                element={
                  <PermissionGate permissions={['projects:view']} effectivePermissions={effectivePermissions}>
                    <ProjectListPage
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentUserId={currentUserNonNull.id}
                      currentUserName={currentUserNonNull.name}
                      onAddNotification={workspace.addNotification}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/projects/:projectId"
                element={
                  <PermissionGate permissions={['projects:view']} effectivePermissions={effectivePermissions}>
                    <ProjectsModule
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentUserId={currentUserNonNull.id}
                      currentUserName={currentUserNonNull.name}
                      onAddNotification={workspace.addNotification}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/projects/:projectId/board"
                element={
                  <PermissionGate permissions={['projects:view']} effectivePermissions={effectivePermissions}>
                    <ProjectBoardPage
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentUserId={currentUserNonNull.id}
                      currentUserName={currentUserNonNull.name}
                      onAddNotification={workspace.addNotification}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/projects/:projectId/tasks/:taskId"
                element={
                  <PermissionGate permissions={['projects:view']} effectivePermissions={effectivePermissions}>
                    <TaskDetailPage
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentUserId={currentUserNonNull.id}
                      currentUserName={currentUserNonNull.name}
                      onAddNotification={workspace.addNotification}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/onboarding"
                element={
                  <PermissionGate permissions={['onboarding:manage']} effectivePermissions={effectivePermissions}>
                    <OnboardingModule
                      onboardings={workspace.onboardings}
                      employees={workspace.employees}
                      currentRole={currentRole}
                      departments={workspace.departments}
                      onUpdateOnboarding={workspace.handleUpdateOnboarding}
                      onAddOnboarding={workspace.handleAddOnboarding}
                      onActivateEmployee={workspace.handleActivateEmployee}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/offboarding"
                element={
                  <PermissionGate permissions={['offboarding:view']} effectivePermissions={effectivePermissions}>
                    <OffboardingModule
                      offboardings={workspace.offboardings}
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentEmployeeId={currentUserNonNull.employeeId}
                      onUpdateOffboarding={workspace.handleUpdateOffboarding}
                      onAddOffboarding={workspace.handleAddOffboarding}
                      onArchiveEmployee={workspace.handleArchiveEmployee}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/reports"
                element={
                  <PermissionGate permissions={['reports:view']} effectivePermissions={effectivePermissions}>
                    <ReportsModule
                      employees={workspace.employees}
                      rosters={workspace.rosters}
                      attendances={workspace.attendances}
                      tasks={workspace.tasks}
                      onboardings={workspace.onboardings}
                      offboardings={workspace.offboardings}
                      currentRole={currentRole}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/notes"
                element={
                  <PermissionGate permissions={['notes:view']} effectivePermissions={effectivePermissions}>
                    <NotesModule currentRole={currentRole} currentUserName={currentUserNonNull.name} currentUserId={currentUserNonNull.id} />
                  </PermissionGate>
                }
              />

              <Route
                path="/chat"
                element={
                  <PermissionGate permissions={['chat:manage']} effectivePermissions={effectivePermissions}>
                    <ChatModule
                      employees={workspace.employees}
                      currentRole={currentRole}
                      currentUserId={currentUserNonNull.id}
                      currentUserName={currentUserNonNull.name}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/users"
                element={
                  <PermissionGate permissions={['users:view']} effectivePermissions={effectivePermissions}>
                    <TeamModule
                      canInvite={effectivePermissions.includes('users:invite')}
                      canUpdateUser={effectivePermissions.includes('users:update')}
                      canDeleteUser={effectivePermissions.includes('users:delete')}
                      canViewEmployee={effectivePermissions.includes('employees:view')}
                      canUpdateEmployee={effectivePermissions.includes('employees:update')}
                      currentUserId={currentUserNonNull.id}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/roles"
                element={
                  <PermissionGate permissions={['roles:view']} effectivePermissions={effectivePermissions}>
                    <RolesModule
                      canCreate={effectivePermissions.includes('roles:create')}
                      canUpdate={effectivePermissions.includes('roles:update')}
                      canDelete={effectivePermissions.includes('roles:delete')}
                    />
                  </PermissionGate>
                }
              />

              <Route
                path="/permissions"
                element={
                  <PermissionGate permissions={['roles:view']} effectivePermissions={effectivePermissions}>
                    <PermissionsCatalog />
                  </PermissionGate>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* Invite Member Modal (real API invitation with role assignment) */}
      {showInviteModal && (
        <InviteModalWithRoles onClose={() => setShowInviteModal(false)} onInvited={() => setShowInviteModal(false)} />
      )}

      {/* Dynamic Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-fadeIn bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-850 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global toast host (API errors, auth events, success confirmations) */}
      <ToastHost />

      {/* Change Password Modal */}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}