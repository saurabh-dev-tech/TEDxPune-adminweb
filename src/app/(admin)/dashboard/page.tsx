"use client";

import { useEffect, useState } from "react";
import {
  Users, UserCheck, Clock, Ban, FileText, MessageCircle, Heart,
} from "lucide-react";
import { MetricCard }              from "@/components/dashboard/MetricCard";
import { GrowthChart }             from "@/components/dashboard/GrowthChart";
import { PendingApprovalsWidget }  from "@/components/dashboard/PendingApprovalsWidget";
import { api } from "@/lib/api";
import type { Metrics } from "@/types";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    api.metrics.get().then(setMetrics).catch(() => {});
  }, []);

  const engagement = metrics ? (metrics.totalComments + metrics.totalLikes) : 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Page heading */}
      <div>
        <span className="rule-red" />
        <p className="kicker text-faint mb-1.5">01 / dashboard</p>
        <h1
          className="text-[34px] leading-[1.02] tracking-[-0.8px] text-ink"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Community Overview
        </h1>
      </div>

      {/* Row 1 — member stats */}
      <section>
        <p className="kicker text-faint mb-3">Members</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            title="Total Members"
            value={metrics?.totalUsers ?? "—"}
            icon={Users}
            description="All registered accounts"
          />
          <MetricCard
            title="Active"
            value={metrics?.activeUsers ?? "—"}
            icon={UserCheck}
            description="Status · ACTIVE"
          />
          <MetricCard
            title="Pending Approval"
            value={metrics?.pendingApprovals ?? "—"}
            icon={Clock}
            variant={(metrics?.pendingApprovals ?? 0) > 0 ? "action" : "default"}
            description="Awaiting review"
          />
          <MetricCard
            title="Suspended"
            value={metrics?.blockedUsers ?? "—"}
            icon={Ban}
            variant={(metrics?.blockedUsers ?? 0) > 0 ? "alert" : "default"}
            description="Status · BLOCKED"
          />
        </div>
      </section>

      {/* Row 2 — content stats */}
      <section>
        <p className="kicker text-faint mb-3">Content</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            title="Total Posts"
            value={metrics?.totalPosts ?? "—"}
            icon={FileText}
            description="Active feed posts"
          />
          <MetricCard
            title="Comments"
            value={metrics?.totalComments ?? "—"}
            icon={MessageCircle}
            description="Threaded replies"
          />
          <MetricCard
            title="Engagement"
            value={engagement || "—"}
            icon={Heart}
            description="Comments + likes"
          />
        </div>
      </section>

      {/* Row 3 — chart + queue */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3">
          <GrowthChart />
        </div>
        <div className="lg:col-span-2">
          <PendingApprovalsWidget />
        </div>
      </section>

    </div>
  );
}
