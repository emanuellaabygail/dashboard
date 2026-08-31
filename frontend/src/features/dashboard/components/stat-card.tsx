import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type StatBadgeTone = "good" | "warning" | "critical";

const badgeStyles: Record<StatBadgeTone, string> = {
  good: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  critical: "bg-red-100 text-red-800"
};

const badgeIcons: Record<StatBadgeTone, typeof TrendingUp> = {
  good: TrendingUp,
  warning: AlertTriangle,
  critical: TrendingDown
};

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  badge?: { label: string; tone: StatBadgeTone };
}

export function StatCard({ title, value, hint, badge }: StatCardProps) {
  const BadgeIcon = badge ? badgeIcons[badge.tone] : null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {badge ? (
          <span
            className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[badge.tone]}`}
          >
            {BadgeIcon ? <BadgeIcon className="size-3" aria-hidden="true" /> : null}
            {badge.label}
          </span>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
