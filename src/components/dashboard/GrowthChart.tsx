"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MOCK_DATA = [
  { week: "W1", users: 12,  posts: 40  },
  { week: "W2", users: 28,  posts: 75  },
  { week: "W3", users: 35,  posts: 110 },
  { week: "W4", users: 55,  posts: 155 },
  { week: "W5", users: 70,  posts: 200 },
  { week: "W6", users: 95,  posts: 260 },
  { week: "W7", users: 120, posts: 330 },
  { week: "W8", users: 150, posts: 410 },
];

export function GrowthChart() {
  return (
    <div className="rounded-[10px] border border-hairline bg-paper p-5">
      {/* Section header */}
      <span className="rule-red" />
      <p className="kicker text-faint mb-4">Community Growth · 8-week trend</p>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={MOCK_DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#E11D2E" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#E11D2E" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#52525B" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#52525B" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E4E4E7"
            vertical={false}
          />
          <XAxis
            dataKey="week"
            tick={{ fill: "#A1A1AA", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#A1A1AA", fontSize: 10, fontFamily: "var(--font-jetbrains-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #E4E4E7",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-inter)",
              boxShadow: "none",
            }}
            labelStyle={{ color: "#0A0A0A", fontWeight: 600 }}
            itemStyle={{ color: "#52525B" }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#E11D2E"
            strokeWidth={1.5}
            fill="url(#gradUsers)"
            name="Members"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="posts"
            stroke="#52525B"
            strokeWidth={1.5}
            fill="url(#gradPosts)"
            name="Posts"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-5 mt-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-red" />
          <span className="kicker text-faint">Members</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-slate" />
          <span className="kicker text-faint">Posts</span>
        </div>
      </div>
    </div>
  );
}
