import { createContext, useContext, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import {
  canCreateTickets,
  canManageUsers,
  canManageWorkflow,
  canViewAnalytics
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
  BadgeAlert
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

  return (
    <AppShellContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-[#eef0f3] text-slate-900">
        <div
          className={`grid min-h-screen gap-4 p-4 transition-all duration-300 ${
            collapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[250px_1fr]"
          }`}
        >
        <aside
          className={`relative transition-all duration-300 ${
            collapsed
              ? "bg-transparent p-0 shadow-none"
              : "rounded-[10px] bg-white p-4 shadow-sm"
          }`}
        >
          {collapsed ? (
            <div className="flex h-full min-h-[60px] items-start justify-center pt-2">
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <ChevronLeft size={16} className="rotate-180" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <Link to="/dashboard" className="flex justify-center">
                  <img
                    src={logo}
                    alt="FixMyCity logo"
                    className="h-12 w-auto"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:bg-slate-50"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              <nav className="mt-10 space-y-2">
                <NavItem
                  to="/dashboard"
                  label="Dashboard"
                  icon={<LayoutDashboard size={18} />}
                />

                {canCreate ? (
                  <NavItem
                    to="/reportIssue"
                    label="Report Issue"
                    icon={<FilePlus2 size={18} />}
                  />
                ) : null}

                <NavItem
                  to="/myReport"
                  label="My Reports"
                  icon={<ClipboardList size={18} />}
                />

                <NavItem
                  to="/dashboard"
                  label="Profile / Settings"
                  icon={<Settings size={18} />}
                />

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

                {canWorkflow ? (
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
              </nav>

              <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-medium text-slate-700">Signed in as</div>
                <div className="mt-1">
                  {user?.name}
                  <br />
                  {user?.role}
                </div>

                <button
                  onClick={logout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-100"
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
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-50"
        }`
      }
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 bg-white shadow-sm">
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
