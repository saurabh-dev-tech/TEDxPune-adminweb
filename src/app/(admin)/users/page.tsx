"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Loader2, CheckCircle, Ban, RotateCcw } from "lucide-react";
import { Input }  from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { User, UserStatus } from "@/types";

const STATUS_TABS: { value: "ALL" | UserStatus; label: string }[] = [
  { value: "ALL",              label: "All"     },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "ACTIVE",           label: "Active"  },
  { value: "BLOCKED",          label: "Blocked" },
];

/* Deterministic avatar palette — design system spec */
const AVATAR_PALETTE = [
  "#0F172A","#7C2D12","#1E3A8A","#14532D",
  "#581C87","#78350F","#831843","#164E63",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function StatusBadge({ status }: { status: UserStatus }) {
  const cls: Record<UserStatus, string> = {
    ACTIVE:           "status-active",
    PENDING_APPROVAL: "status-pending",
    BLOCKED:          "status-blocked",
  };
  const label: Record<UserStatus, string> = {
    ACTIVE: "Active", PENDING_APPROVAL: "Pending", BLOCKED: "Blocked",
  };
  return (
    <span className={`role-badge ${cls[status]}`}>{label[status]}</span>
  );
}

function SocialTag({ user }: { user: User }) {
  const provider = user.linkedin_id ? "LinkedIn" : user.google_id ? "Google" : user.apple_id ? "Apple" : null;
  if (!provider) return <span className="kicker text-faint">—</span>;
  return <span className="kicker text-slate">{provider}</span>;
}

export default function UsersPage() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [tab,         setTab]         = useState<"ALL" | UserStatus>("ALL");
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: UserStatus; page: number; limit: number } = { page, limit: 20 };
      if (tab !== "ALL") params.status = tab;
      const res = await api.users.list(params);
      setUsers(res.items);
      setTotal(res.total);
    } catch {
      toast.error("Failed to load members.");
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = search
    ? users.filter(u =>
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  async function handleAction(id: string, status: UserStatus) {
    setActionLoading(id);
    try {
      await api.users.updateStatus(id, status);
      toast.success(status === "ACTIVE" ? "Member approved." : "Member blocked.");
      await fetchUsers();
    } catch {
      toast.error("Action failed.");
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Heading */}
      <div>
        <span className="rule-red" />
        <p className="kicker text-faint mb-1.5">02 / members</p>
        <h1
          className="text-[28px] leading-[1.0] tracking-[-0.6px] text-ink"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Member Directory
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="shrink-0">
          <TabsList className="bg-mist border-0 h-9 p-0.5 rounded-[8px]">
            {STATUS_TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-ink data-[state=active]:text-paper text-slate text-[12px] font-medium px-3 h-7 rounded-[6px]"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint stroke-[1.6]" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-mist border-transparent rounded-[8px] text-[13px] text-ink placeholder:text-faint focus:border-hairline focus:bg-paper"
          />
        </div>

        <span className="kicker text-faint ml-auto">
          {total.toLocaleString("en-IN")} members
        </span>
      </div>

      {/* Table */}
      <div className="rounded-[10px] border border-hairline bg-paper overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-hairline hover:bg-transparent">
              {["Member","Email","Social","Status","Joined","Actions"].map((h, i) => (
                <TableHead
                  key={h}
                  className={`kicker text-faint py-3 ${i >= 1 && i <= 2 ? "hidden md:table-cell" : ""} ${i === 2 ? "hidden lg:table-cell" : ""} ${i === 4 ? "hidden sm:table-cell" : ""} ${i === 5 ? "text-right" : ""}`}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <Loader2 className="h-4 w-4 animate-spin text-faint mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 kicker text-faint">
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const initials = user.full_name
                  .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                const isActioning = actionLoading === user.id;

                return (
                  <TableRow key={user.id} className="border-hairline hover:bg-mist/50 transition-colors">
                    {/* Member */}
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback
                            className="text-[10px] font-bold text-paper"
                            style={{ background: avatarColor(user.full_name) }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink leading-tight truncate">
                            {user.full_name}
                          </p>
                          {user.headline && (
                            <p className="text-[11px] text-slate truncate max-w-[180px] mt-0.5">
                              {user.headline}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-[12px] text-slate hidden md:table-cell">
                      {user.email}
                    </TableCell>

                    {/* Social */}
                    <TableCell className="hidden lg:table-cell">
                      <SocialTag user={user} />
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="kicker text-faint hidden sm:table-cell">
                      {formatDate(user.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.status === "PENDING_APPROVAL" && (
                          <>
                            <Button
                              size="sm" variant="ghost" disabled={isActioning}
                              onClick={() => handleAction(user.id, "ACTIVE")}
                              className="h-7 px-2 text-[12px] font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                            >
                              {isActioning
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <><CheckCircle className="h-3 w-3 mr-1 stroke-[1.6]" />Approve</>}
                            </Button>
                            <Button
                              size="sm" variant="ghost" disabled={isActioning}
                              onClick={() => handleAction(user.id, "BLOCKED")}
                              className="h-7 px-2 text-[12px] font-medium text-red hover:text-red hover:bg-red-soft rounded-md"
                            >
                              <Ban className="h-3 w-3 mr-1 stroke-[1.6]" />Block
                            </Button>
                          </>
                        )}
                        {user.status === "ACTIVE" && (
                          <Button
                            size="sm" variant="ghost" disabled={isActioning}
                            onClick={() => handleAction(user.id, "BLOCKED")}
                            className="h-7 px-2 text-[12px] font-medium text-red hover:text-red hover:bg-red-soft rounded-md"
                          >
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Ban className="h-3 w-3 mr-1 stroke-[1.6]" />Suspend</>}
                          </Button>
                        )}
                        {user.status === "BLOCKED" && (
                          <Button
                            size="sm" variant="ghost" disabled={isActioning}
                            onClick={() => handleAction(user.id, "ACTIVE")}
                            className="h-7 px-2 text-[12px] font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md"
                          >
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RotateCcw className="h-3 w-3 mr-1 stroke-[1.6]" />Reactivate</>}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="kicker text-faint">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="h-8 text-[12px] border-hairline text-slate hover:text-ink hover:bg-mist rounded-[6px]"
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm" disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-8 text-[12px] border-hairline text-slate hover:text-ink hover:bg-mist rounded-[6px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
