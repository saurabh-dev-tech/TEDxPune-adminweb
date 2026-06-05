"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/* Deterministic avatar palette */
const AVATAR_PALETTE = [
  "#0F172A","#7C2D12","#1E3A8A","#14532D",
  "#581C87","#78350F","#831843","#164E63",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export default function SettingsPage() {
  const { authUser } = useAuth();
  if (!authUser) return null;

  const initials = authUser.fullName
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const roleBadge = authUser.role === "SUPER_ADMIN"
    ? "role-badge role-speaker"   /* red */
    : "role-badge role-organizer"; /* ink */

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* Heading */}
      <div>
        <span className="rule-red" />
        <p className="kicker text-faint mb-1.5">04 / settings</p>
        <h1
          className="text-[28px] leading-[1.0] tracking-[-0.6px] text-ink"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Account
        </h1>
      </div>

      {/* Profile card */}
      <div className="rounded-[10px] border border-hairline bg-paper overflow-hidden">
        {/* Dark banner */}
        <div className="h-20 bg-ink relative" />

        {/* Avatar overlap */}
        <div className="px-6 pb-6">
          <div className="-mt-8 mb-4">
            <Avatar className="h-16 w-16 border-[3px] border-paper ring-2 ring-red">
              <AvatarImage src={authUser.avatarUrl ?? undefined} />
              <AvatarFallback
                className="text-base font-bold text-paper"
                style={{ background: avatarColor(authUser.fullName) }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-[22px] leading-[1.1] text-ink"
                style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
              >
                {authUser.fullName}
              </h2>
              <p className="text-[13px] text-slate mt-0.5">{authUser.email}</p>
            </div>
            <span className={roleBadge}>{authUser.role.replace("_", " ")}</span>
          </div>
        </div>

        {/* Details rows */}
        <div className="border-t border-hairline divide-y divide-hairline">
          {[
            { label: "Tenant ID",        value: authUser.tenantId },
            { label: "User ID",          value: authUser.sub      },
            {
              label: "Session expires",
              value: new Date(authUser.exp * 1000).toLocaleString("en-IN"),
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-6 py-3">
              <p className="kicker text-faint">{label}</p>
              <p className="text-[12px] text-slate font-mono tabular truncate max-w-[240px]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
