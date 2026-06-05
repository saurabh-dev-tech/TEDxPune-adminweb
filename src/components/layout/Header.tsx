"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isSuperAdmin } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Globe } from "lucide-react";

const TENANTS = [
  { id: "pune",   name: "TEDx Pune"   },
  { id: "mumbai", name: "TEDx Mumbai" },
  { id: "delhi",  name: "TEDx Delhi"  },
];

export function Header() {
  const { authUser } = useAuth();
  if (!authUser) return null;

  const initials = authUser.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const superAdmin = isSuperAdmin(authUser);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-hairline bg-paper shrink-0">
      {/* Left: kicker slug */}
      <div className="flex items-center gap-3">
        {/* Tiny red dot */}
        <span className="h-1.5 w-1.5 rounded-full bg-red shrink-0" />
        <span className="kicker text-faint tracking-[1.5px]">
          tedx-pune · admin
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        {/* Tenant switcher — SUPER_ADMIN only */}
        {superAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 kicker text-faint hover:text-ink transition-colors">
              <Globe className="h-3.5 w-3.5" />
              SWITCH TENANT
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-paper border-hairline shadow-none rounded-lg">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="kicker text-faint">
                  TENANTS
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-hairline" />
                {TENANTS.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    className="cursor-pointer text-[13px] text-slate hover:text-ink hover:bg-mist"
                  >
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 group outline-none">
            <Avatar className="h-7 w-7 border border-hairline">
              <AvatarImage src={authUser.avatarUrl ?? undefined} alt={authUser.fullName} />
              <AvatarFallback
                className="text-[10px] font-bold text-paper"
                style={{ background: "#7C2D12" }}   /* deterministic amber — matches dark palette */
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-[13px] font-semibold text-ink">{authUser.fullName}</span>
              <span className="kicker text-faint mt-0.5">{authUser.role.replace("_", " ")}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-faint group-hover:text-ink transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-paper border-hairline shadow-none rounded-lg w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[12px] text-slate font-normal">
                {authUser.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
