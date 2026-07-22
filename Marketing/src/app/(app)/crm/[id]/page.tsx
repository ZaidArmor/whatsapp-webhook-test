import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Phone, Mail, Megaphone, UserRound } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { getContactDetail } from "@/lib/data/crm";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { StageSelect } from "@/components/crm/stage-select";
import { ActivityLog } from "@/components/crm/activity-log";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { t, locale } = await getT();
  const ctx = await requirePermission("manage_crm");

  const contact = await getContactDetail(ctx.workspaceId, id);
  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/crm" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5 rtl:block ltr:hidden" />
          <ArrowLeft className="h-3.5 w-3.5 rtl:hidden ltr:block" />
          {t("common.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          <StageSelect contactId={contact.id} stage={contact.stage} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-3 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t("crm.value")}</span>
              <span className="font-bold tabular-nums">{formatCurrency(Number(contact.value), locale)}</span>
            </div>
            {contact.phone ? (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="tabular-nums" dir="ltr">
                  {contact.phone}
                </span>
              </div>
            ) : null}
            {contact.email ? (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{contact.email}</span>
              </div>
            ) : null}
            {contact.source ? (
              <div className="flex items-center gap-2">
                <PlatformIcon platform={contact.source} className="h-4 w-4" />
                <span>
                  {t("crm.source")}: {t(`platforms.${contact.source}`)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span>
                {t("crm.owner")}: {contact.owner?.name ?? "—"}
              </span>
            </div>
            {contact.campaign ? (
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-muted-foreground" />
                <Link href={`/ads/${contact.campaign.id}`} className="flex items-center gap-1.5 hover:underline">
                  <PlatformIcon platform={contact.campaign.platform} className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{contact.campaign.name}</span>
                </Link>
              </div>
            ) : null}
            <div className="border-t pt-2 text-xs text-muted-foreground">
              {t("common.date")}: <span className="tabular-nums">{formatDate(contact.createdAt, locale)}</span>
            </div>
            {contact.notes ? <p className="rounded-lg bg-muted/60 p-2 text-xs leading-5">{contact.notes}</p> : null}
          </CardContent>
        </Card>

        <ActivityLog
          contactId={contact.id}
          activities={contact.activities.map((activity) => ({
            id: activity.id,
            type: activity.type,
            description: activity.description,
            createdAt: activity.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
