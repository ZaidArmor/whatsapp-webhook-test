"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { navGroups } from "./nav-items";
import { navLabelAr } from "./sidebar";

export function CommandSearch({ permissions }: { permissions: string[] }) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.key === "k" || event.key === "К") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const items = navGroups.flatMap((group) =>
    group.items.filter((item) => !item.permission || permissions.includes(item.permission))
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-md border bg-background px-3 text-sm text-muted-foreground shadow-sm hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">بحث سريع...</span>
        <kbd className="ms-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="ابحث عن صفحة، حملة، عميل..." />
        <CommandList>
          <CommandEmpty>لا توجد نتائج</CommandEmpty>
          <CommandGroup heading="الصفحات">
            {items.map((item) => (
              <CommandItem
                key={item.key}
                value={navLabelAr(item.key)}
                onSelect={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
              >
                <item.icon className="h-4 w-4" />
                {navLabelAr(item.key)}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
