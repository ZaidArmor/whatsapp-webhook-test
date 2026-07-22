import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartCard({ title, description, children, actions, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
          {description ? <CardDescription className="mt-0.5">{description}</CardDescription> : null}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="pt-2">
        {/* Charts stay LTR internally even in RTL pages — Recharts axis labels break otherwise. */}
        <div className="scroll-x-container" dir="ltr">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
