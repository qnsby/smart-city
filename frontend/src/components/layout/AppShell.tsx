import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { isAdminRole } from "../../utils/roles";

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith("/admin");
  const admin = isAdminRole(user?.role);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/map" className="text-sm font-semibold tracking-tight text-slate-900">
            Smart City Platform
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {user?.name} • {user?.role}
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-card">
          <nav className="space-y-1">
            <NavItem to="/map" label="Map & Reporting" />
            {admin ? <NavItem to="/admin/dashboard" label="Admin Dashboard" /> : null}
            {admin ? <NavItem to="/admin/issues" label="Admin Issues" /> : null}
            {admin ? <NavItem to="/admin/users" label="Users" /> : null}
          </nav>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <div className="font-medium text-slate-700">Role access</div>
            <div className="mt-1">
              Citizen: map/reporting only
              <br />
              Dept Admin: issues + analytics + users
              <br />
              University Admin: full admin
            </div>
          </div>
        </aside>

        <main className={isAdminArea ? "min-w-0" : "min-w-0"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 text-sm ${
          isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
