import type { ReactNode } from "react";
import { Bell, Search, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useAppShell } from "./AppShell";
import logo from "../../assets/branding/logo.svg";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  rightSlot?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  rightSlot
}: PageHeaderProps) {
  const { user } = useAuth();
  const appShell = useAppShell();
  const showSearch = typeof searchValue === "string" && typeof onSearchChange === "function";
  const collapsed = appShell?.collapsed ?? false;

  return (
    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div className="flex items-start gap-4">
        {collapsed ? (
          <div className="flex items-center gap-4 px-2 py-2">
            <Link to="/dashboard" className="flex justify-center">
              <img src={logo} alt="FixMyCity logo" className="h-12 w-auto" />
            </Link>
          </div>
        ) : null}

        <div>
          <h1 className="text-[34px] font-extrabold leading-none text-[#202020]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-[18px] text-[#2B2B2B]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4">
        {showSearch ? (
          <div className="flex h-[54px] w-[560px] max-w-full items-center rounded-[10px] bg-[#FFFFFF] px-5 shadow-sm">
            <Search size={20} className="mr-3 text-[#2B2B2B]/60" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-[18px] text-[#202020] outline-none placeholder:text-[#2B2B2B]/60"
            />
          </div>
        ) : null}

        {rightSlot}

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-[54px] w-[54px] items-center justify-center rounded-[10px] bg-[#FFFFFF] text-[#2B2B2B] shadow-sm"
        >
          <Bell size={20} />
        </button>

        <div className="flex h-[54px] min-w-[54px] items-center justify-center rounded-full bg-[#2E2E5A]/12 px-3 text-[#2E2E5A] shadow-sm">
          <User size={22} />
        </div>
      </div>
    </div>
  );
}
