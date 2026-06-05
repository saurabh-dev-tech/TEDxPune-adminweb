"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { User } from "@/types";
import { formatDistanceToNow } from "@/lib/utils";

/* Deterministic avatar colour — same palette as the design system */
const AVATAR_PALETTE = [
  "#0F172A","#7C2D12","#1E3A8A","#14532D",
  "#581C87","#78350F","#831843","#164E63",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function PendingApprovalsWidget() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    api.users
      .list({ status: "PENDING_APPROVAL", page: 1, limit: 3 })
      .then((res) => setUsers(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: string, status: "ACTIVE" | "BLOCKED") {
    setActionLoading(id);
    try {
      await api.users.updateStatus(id, status);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success(status === "ACTIVE" ? "Member approved." : "Member blocked.");
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="rounded-[10px] border border-hairline bg-paper p-5 h-full">
      {/* Kicker header */}
      <span className="rule-red" />
      <div className="flex items-center gap-2 mb-4">
        <p className="kicker text-faint">Approval Queue</p>
        {users.length > 0 && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-28">
          <Loader2 className="h-4 w-4 animate-spin text-faint" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 gap-1.5">
          <CheckCircle className="h-4 w-4 text-green-500 stroke-[1.6]" />
          <p className="kicker text-faint">All caught up</p>
        </div>
      ) : (
        <ul className="divide-y divide-hairline">
          {users.map((user) => {
            const provider = user.linkedin_id ? "LinkedIn"
              : user.google_id ? "Google" : "Apple";
            const initials = user.full_name
              .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
            const isActioning = actionLoading === user.id;

            return (
              <li key={user.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback
                    className="text-[10px] font-bold text-paper"
                    style={{ background: avatarColor(user.full_name) }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-ink leading-tight truncate">
                    {user.full_name}
                  </p>
                  <p className="kicker text-faint mt-0.5">
                    {provider} · {formatDistanceToNow(user.created_at)}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(user.id, "ACTIVE")}
                    disabled={isActioning}
                    className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                  >
                    {isActioning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 stroke-[1.6]" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(user.id, "BLOCKED")}
                    disabled={isActioning}
                    className="h-7 px-2 text-red hover:text-red hover:bg-red-soft rounded-md"
                  >
                    <XCircle className="h-3.5 w-3.5 stroke-[1.6]" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
