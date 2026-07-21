"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { navLabelAr } from "./sidebar";

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || pathname === "/dashboard") return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground">
        الرئيسية
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        // Prisma cuids are long, mixed alphanumeric, and always contain a digit —
        // distinct enough from short route words (e.g. "duplicates") to detect safely.
        const looksLikeId = segment.length >= 20 && /\d/.test(segment) && /^[a-z0-9]+$/i.test(segment);
        const label = looksLikeId ? "التفاصيل" : navLabelAr(segment);
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5 rtl-flip" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
