import Link from "next/link";
import type { PipelineStage } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { getContacts, getPipelineSummary, getCrmOptions } from "@/lib/data/crm";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { NewContactDialog } from "@/components/crm/contact-form";
import { StageSelect } from "@/components/crm/stage-select";
import { cn, formatCurrency } from "@/lib/utils";

const STAGES: PipelineStage[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];

const STAGE_ACCENT: Record<PipelineStage, string> = {
  NEW: "border-s-sky-500",
  CONTACTED: "border-s-indigo-500",
  QUALIFIED: "border-s-violet-500",
  PROPOSAL: "border-s-amber-500",
  WON: "border-s-success",
  LOST: "border-s-destructive",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CrmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t, locale } = await getT();
  const ctx = await requirePermission("manage_crm");

  const stageFilter = STAGES.includes(params.stage as PipelineStage) ? (params.stage as PipelineStage) : undefined;

  const [contacts, pipeline, options] = await Promise.all([
    getContacts(ctx.workspaceId, stageFilter),
    getPipelineSummary(ctx.workspaceId),
    getCrmOptions(ctx.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("crm.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("crm.subtitle")}</p>
        </div>
        <NewContactDialog owners={options.owners} campaigns={options.campaigns} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {pipeline.map((row) => (
          <Link
            key={row.stage}
            href={stageFilter === row.stage ? "/crm" : `/crm?stage=${row.stage}`}
            className={cn(
              "rounded-xl border border-s-4 bg-card p-3 transition-colors hover:bg-muted/60",
              STAGE_ACCENT[row.stage],
              stageFilter === row.stage && "ring-2 ring-primary/40"
            )}
          >
            <div className="text-xs font-medium text-muted-foreground">{t(`crm.stages.${row.stage}`)}</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{row.count}</div>
            <div className="text-xs tabular-nums text-muted-foreground">{formatCurrency(row.value, locale)}</div>
          </Link>
        ))}
      </div>

      {contacts.length === 0 ? (
        <EmptyState title={t("common.noData")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.contactName")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.phone")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.source")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.stage")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.value")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.owner")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("crm.linkedCampaign")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                  <td className="px-3 py-2">
                    <Link href={`/crm/${contact.id}`} className="font-medium hover:underline">
                      {contact.name}
                    </Link>
                    {contact.email ? (
                      <div className="text-xs text-muted-foreground" dir="ltr">
                        {contact.email}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 tabular-nums" dir="ltr">
                    {contact.phone ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {contact.source ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <PlatformIcon platform={contact.source} className="h-3.5 w-3.5" />
                        {t(`platforms.${contact.source}`)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StageSelect contactId={contact.id} stage={contact.stage} />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{formatCurrency(Number(contact.value), locale)}</td>
                  <td className="px-3 py-2 text-xs">{contact.owner?.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {contact.campaign ? (
                      <Link href={`/ads/${contact.campaign.id}`} className="flex items-center gap-1.5 text-xs hover:underline">
                        <PlatformIcon platform={contact.campaign.platform} className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">{contact.campaign.name}</span>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
