"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, FileText, Video, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard, screen: "01" },
  { href: "/users",     label: "Members",    icon: Users,            screen: "02" },
  { href: "/posts",     label: "Posts",      icon: FileText,         screen: "03" },
  { href: "/videos",    label: "Videos",     icon: Video,            screen: "04" },
  { href: "/settings",  label: "Settings",   icon: Settings,         screen: "05" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="flex h-full w-56 flex-col bg-paper border-r border-hairline shrink-0">
      {/* Wordmark */}
      <div className="px-5 pt-6 pb-5 border-b border-hairline">
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[22px] font-bold tracking-tight text-ink leading-none"
            style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
          >
            TED<span className="text-red">x</span>
          </span>
          <span className="kicker text-faint">Pune</span>
        </div>
        <p className="kicker text-faint mt-1.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, screen }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "text-ink border-l-2 border-red pl-[10px] bg-mist"
                  : "text-slate hover:text-ink hover:bg-mist border-l-2 border-transparent pl-[10px]"
              )}
            >
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 stroke-[1.6]",
                  active ? "text-red" : "text-slate group-hover:text-ink"
                )}
              />
              <span className="flex-1">{label}</span>
              <span
                className={cn(
                  "kicker",
                  active ? "text-red" : "text-faint opacity-0 group-hover:opacity-100"
                )}
              >
                {screen}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-hairline">
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium text-slate hover:text-red hover:bg-red-soft border-l-2 border-transparent pl-[10px] transition-colors"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[1.6] text-slate group-hover:text-red" />
          Sign Out
        </button>
        <p className="kicker text-faint mt-4 px-3">v1.0 · mvp</p>
      </div>
    </aside>
  );
}
