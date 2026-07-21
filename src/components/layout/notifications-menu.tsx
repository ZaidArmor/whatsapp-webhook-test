"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  createdAt: string;
}

const severityVariant: Record<NotificationItem["severity"], "muted" | "warning" | "destructive"> = {
  INFO: "muted",
  WARNING: "warning",
  CRITICAL: "destructive",
};

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4.5 w-4.5" />
          {items.length > 0 && (
            <span className="absolute end-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>التنبيهات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">لا توجد تنبيهات جديدة</p>
        ) : (
          items.slice(0, 6).map((item) => (
            <DropdownMenuItem key={item.id} asChild className="flex-col items-start gap-1 whitespace-normal">
              <Link href="/alerts">
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <Badge variant={severityVariant[item.severity]} className={cn("shrink-0")}>
                    {item.severity === "CRITICAL" ? "خطر" : item.severity === "WARNING" ? "تنبيه" : "معلومة"}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                <span className="text-[10px] text-muted-foreground">{formatDateTime(item.createdAt)}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/alerts" className="justify-center text-sm text-primary">
            عرض كل التنبيهات
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
