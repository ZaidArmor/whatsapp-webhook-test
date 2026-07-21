"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { navGroups } from "./nav-items";
import { navLabelAr, navLabelEn } from "./sidebar";

export function MobileSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="start" className="flex w-72 flex-col p-0">
        <SheetHeader className="flex-row items-center gap-2 space-y-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <SheetTitle className="text-primary">ARMOR</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || permissions.includes(item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.labelEn}>
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {locale === "ar" ? group.labelAr : group.labelEn}
                </div>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <SheetClose asChild key={item.key}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4.5 w-4.5 shrink-0" />
                          <span>{locale === "ar" ? navLabelAr(item.key) : navLabelEn(item.key)}</span>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
