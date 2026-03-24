import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { isAdminRole } from "../../utils/roles";
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
  LogOut
} from "lucide-react";
import { useState } from "react";

export function AppShell() {
  const { user, logout } = useAuth();
  const admin = isAdminRole(user?.role);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#eef0f3] text-slate-900">
      <div className={`grid min-h-screen gap-4 p-4 transition-all duration-300 ${
        collapsed ? "grid-cols-[80px_1fr]" : "grid-cols-[250px_1fr]"
      }`}>
        <aside className="rounded-[10px] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <Link to="/map">
              <img src={logo} alt="FixMyCity logo" className="h-12 w-auto" />
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600"
            >
              <ChevronLeft 
              size={16} 
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          <nav className="mt-10 space-y-2">
            <NavItem to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={18}/>} collapsed={collapsed}/>
            <NavItem to="/reportIssue" label="Report Issue" icon={<FilePlus2 size={18} />} collapsed={collapsed}/>
            <NavItem to="/myReport" label="My Reports" icon={<ClipboardList size={18} />} collapsed={collapsed}/>
            <NavItem to="/dashboard" label="Profile / Settings" icon={<Settings size={18} />} collapsed={collapsed}/>

            {admin ? (
              <NavItem
                to="/admin/dashboard"
                label="Admin Dashboard"
                icon={<Shield size={18} />}
                collapsed={collapsed}
              />
            ) : null}

            {admin ? (
              <NavItem
                to="/admin/issues"
                label="Admin Issues"
                icon={<ListChecks size={18} />}
                collapsed={collapsed}
              />
            ) : null}

            {admin ? (
              <NavItem to="/admin/users" label="Users" icon={<Users size={18} />} collapsed={collapsed}/>
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  collapsed
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  collapsed:boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-3 text-[16px] transition ${
          isActive
            ? "bg-slate-100 font-medium text-slate-900"
            : "text-slate-600 hover:bg-slate-50"
        }`
      }
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 bg-white shadow-sm">
        {icon}
      </span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}