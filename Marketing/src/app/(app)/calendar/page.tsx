import Link from "next/link";
import { ChevronRight, ChevronLeft, PenSquare } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getMonthPosts } from "@/lib/data/posts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t, locale } = await getT();
  const ctx = await getWorkspaceContext();

  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = params.month !== undefined && !Number.isNaN(Number(params.month)) ? Number(params.month) : now.getMonth();

  const posts = await getMonthPosts(ctx.workspaceId, year, month);

  const intl = locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US";
  const monthLabel = new Intl.DateTimeFormat(intl, { year: "numeric", month: "long" }).format(new Date(year, month, 1));

  // Week starts Sunday (index 0) — matches the Saudi work week.
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdayLabels = Array.from({ length: 7 }, (_, weekday) =>
    new Intl.DateTimeFormat(intl, { weekday: "short" }).format(new Date(2024, 8, 1 + weekday))
  );

  const postsByDay = new Map<number, typeof posts>();
  for (const post of posts) {
    const when = post.status === "PUBLISHED" ? (post.publishedAt ?? post.scheduledAt) : post.scheduledAt;
    if (!when || when.getMonth() !== month || when.getFullYear() !== year) continue;
    const day = when.getDate();
    postsByDay.set(day, [...(postsByDay.get(day) ?? []), post]);
  }

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const isToday = (day: number) => year === now.getFullYear() && month === now.getMonth() && day === now.getDate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("calendar.subtitle")}</p>
        </div>
        {ctx.can("create_posts") ? (
          <Button asChild>
            <Link href="/posts/new">
              <PenSquare className="h-4 w-4" />
              {t("posts.newPost")}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/calendar?year=${prev.year}&month=${prev.month}`} aria-label={t("calendar.prevMonth")}>
            <ChevronRight className="h-4 w-4 rtl:block ltr:hidden" />
            <ChevronLeft className="h-4 w-4 rtl:hidden ltr:block" />
            {t("calendar.prevMonth")}
          </Link>
        </Button>
        <h2 className="text-lg font-semibold tabular-nums">{monthLabel}</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/calendar?year=${next.year}&month=${next.month}`} aria-label={t("calendar.nextMonth")}>
            {t("calendar.nextMonth")}
            <ChevronLeft className="h-4 w-4 rtl:block ltr:hidden" />
            <ChevronRight className="h-4 w-4 rtl:hidden ltr:block" />
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <div className="grid min-w-[840px] grid-cols-7 border-b bg-muted/50">
          {weekdayLabels.map((label) => (
            <div key={label} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[840px] grid-cols-7">
          {cells.map((day, i) => (
            <div
              key={i}
              className={cn(
                "min-h-28 border-b border-e p-1.5 [&:nth-child(7n)]:border-e-0",
                day === null && "bg-muted/30",
                i >= cells.length - 7 && "border-b-0"
              )}
            >
              {day !== null ? (
                <>
                  <div
                    className={cn(
                      "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                      isToday(day) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    {day}
                  </div>
                  <div className="space-y-1">
                    {(postsByDay.get(day) ?? []).slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        className={cn(
                          "flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] leading-tight",
                          post.status === "PUBLISHED" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                        )}
                        title={post.body}
                      >
                        <span className="flex shrink-0 gap-0.5">
                          {[...new Set(post.targets.map((target) => target.socialAccount.platform))].slice(0, 2).map((p) => (
                            <PlatformIcon key={p} platform={p} className="h-3 w-3" colored={false} />
                          ))}
                        </span>
                        <span className="truncate">{post.title ?? post.body}</span>
                      </div>
                    ))}
                    {(postsByDay.get(day)?.length ?? 0) > 3 ? (
                      <Badge variant="muted" className="px-1.5 py-0 text-[10px]">
                        +{(postsByDay.get(day)?.length ?? 0) - 3}
                      </Badge>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
