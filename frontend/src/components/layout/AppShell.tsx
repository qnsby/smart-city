import { createContext, useContext, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import {
  canCreateTickets,
  canManageUsers,
  canManageWorkflow,
  canViewAnalytics,
  canManageTasks,
  isAdminRole
} from "../../utils/roles";
import logo from "../../assets/branding/logo.svg";
import {
  ChevronLeft,
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  Settings,
  Shield,
  ListChecks,
  Users,
  LogOut,
  BadgeAlert,
  ChartLine,
} from "lucide-react";

const AppShellContext = createContext<{
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
} | null>(null);

export function AppShell() {
  const { user, logout } = useAuth();
  const canCreate = canCreateTickets(user?.role);
  const canWorkflow = canManageWorkflow(user?.role);
  const canAnalytics = canViewAnalytics(user?.role);
  const canUsers = canManageUsers(user?.role);
  const [collapsed, setCollapsed] = useState(false);
  const canTasks = canManageTasks(user?.role)
  const isAdmin = isAdminRole(user?.role)

  return (
    <AppShellContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-[#F2F5F8] text-[#202020]">
        <div
          className={`grid min-h-screen gap-4 p-4 transition-all duration-300 ${
              collapsed ? "grid-cols-[70px_1fr]" : "grid-cols-[300px_1fr]"
          }`}
        >
        <aside
          className={`relative transition-all duration-300 ${
            collapsed
              ? "bg-transparent p-0 shadow-none"
              : "rounded-[10px] bg-[#FFFFFF] p-4 shadow-sm"
          }`}
        >
          {collapsed ? (
            <div className="flex h-full min-h-[60px] items-start justify-center pt-2">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2B2B2B]/15 bg-[#FFFFFF] text-[#2B2B2B] shadow-sm transition hover:bg-[#F2F5F8]"
              >
                <ChevronLeft size={16} className="rotate-180" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <Link to="/dashboard" className="flex justify-center">
                  <img
                    src={logo}
                    alt="FixMyCity logo"
                    className="h-[64px] w-auto object-contain"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2B2B2B]/15 text-[#2B2B2B] transition hover:bg-[#F2F5F8]"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              <nav className="mt-10 space-y-2">
                {canCreate ? (
                  <NavItem
                    to="/dashboard"
                    label="Dashboard"
                    icon={<LayoutDashboard size={18} />}
                  />
                ) : null}

                {canCreate ? (
                  <NavItem
                    to="/reportIssue"
                    label="Report Issue"
                    icon={<FilePlus2 size={18} />}
                  />
                ) : null}

                {canCreate ? (
                  <NavItem
                    to="/myReport"
                    label="My Reports"
                    icon={<ClipboardList size={18} />}
                  />
                ) : null}

                {canWorkflow ? (
                  <NavItem
                    to="/operator"
                    label="Operator Page"
                    icon={<BadgeAlert size={18} />}
                  />
                ) : null}

                {canAnalytics ? (
                  <NavItem
                    to="/admin/dashboard"
                    label="Admin Dashboard"
                    icon={<Shield size={18} />}
                  />
                ) : null}

                {isAdmin ? (
                  <NavItem
                    to="/admin/issues"
                    label="Admin Issues"
                    icon={<ListChecks size={18} />}
                  />
                ) : null}

                {canUsers ? (
                  <NavItem
                    to="/admin/users"
                    label="Users"
                    icon={<Users size={18} />}
                  />
                ) : null}

                {canTasks ? (
                  <NavItem
                    to="/tasks"
                    label="My Tasks"
                    icon={<ClipboardList size={18} />}
                  />
                ) : null}

                {canAnalytics ? (
                  <NavItem
                    to="/analytics/dashboard"
                    label="Dashboard"
                    icon={<LayoutDashboard size={18} />}
                  />
                ) : null }
                {canAnalytics ? (
                  <NavItem
                    to="/analytics"
                    label="Analytics"
                    icon={<ChartLine size={18} />}
                  />
                ) : null}
                <NavItem
                  to="/dashboard"
                  label="Profile / Settings"
                  icon={<Settings size={18} />}
                />
              </nav>

              <div className="mt-6 rounded-xl bg-[#F2F5F8] p-3 text-xs text-[#2B2B2B]">
                <div className="font-medium text-[#202020]">Signed in as</div>
                <div className="mt-1">
                  {user?.name}
                  <br />
                  {user?.role}
                </div>

                <button
                  onClick={logout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#2B2B2B]/15 px-3 py-2 text-sm transition hover:bg-[#FFFFFF]"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </>
          )}
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
        </div>
      </div>
    </AppShellContext.Provider>
  );
}

function NavItem({
  to,
  label,
  icon
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-3 transition ${
          isActive
            ? "bg-[#F2F5F8] text-[#202020]"
            : "text-[#2B2B2B] hover:bg-[#FFFFFF]"
        }`
      }
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#2B2B2B]/10 bg-[#FFFFFF] shadow-sm">
        {icon}
      </span>
      <span className="text-[16px]">{label}</span>
    </NavLink>
  );
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  return ctx;
}
