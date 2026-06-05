import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  /** "action" = amber pulse dot, "alert" = red, "default" = neutral */
  variant?: "default" | "action" | "alert";
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
}: MetricCardProps) {
  const isAction = variant === "action";
  const isAlert  = variant === "alert";

  return (
    <div className="group relative rounded-[10px] border border-hairline bg-paper p-5 hover:border-slate/30 transition-colors">
      {/* Kicker label */}
      <div className="flex items-center justify-between mb-3">
        <span className="kicker text-faint">{title}</span>
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
            isAction ? "bg-amber-50"   : isAlert ? "bg-red-soft" : "bg-mist"
          )}
        >
          <Icon
            className={cn(
              "h-[15px] w-[15px] stroke-[1.6]",
              isAction ? "text-amber-500" : isAlert ? "text-red" : "text-slate"
            )}
          />
        </div>
      </div>

      {/* Value — Instrument Serif, tabular */}
      <div className="flex items-end gap-2">
        <span
          className={cn(
            "text-4xl leading-none tabular text-ink",
            isAlert && "text-red"
          )}
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </span>
        {/* Pulse dot for action-needed */}
        {isAction && (
          <span className="relative flex h-2 w-2 mb-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-[12px] text-slate leading-snug">{description}</p>
      )}

      {/* Red rule appears on hover */}
      <div
        className={cn(
          "absolute bottom-0 left-5 h-[2px] w-5 rounded-full transition-all duration-300",
          "bg-red opacity-0 group-hover:opacity-100"
        )}
      />
    </div>
  );
}
