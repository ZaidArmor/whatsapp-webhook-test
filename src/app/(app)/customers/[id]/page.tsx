import { notFound } from "next/navigation";
import { Mail, MapPin, Building2, Wrench, Megaphone, Calendar } from "lucide-react";
import { getCustomerDetail } from "@/lib/data/customers";
import { auth } from "@/lib/auth/auth";
import { canViewFullPhone, displayPhone } from "@/lib/phone/mask";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CustomerStatusSelect,
  CustomerTagsEditor,
  CustomerNotesForm,
  CustomerConsentToggle,
  CustomerDeleteButton,
} from "@/components/customers/customer-detail-panels";
import { CustomerActivityTimeline } from "@/components/customers/customer-activity-timeline";
import { LEAD_SOURCE_LABELS, PHONE_VALIDITY_LABELS } from "@/lib/constants/customer";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [customer, session] = await Promise.all([getCustomerDetail(id), auth()]);
  if (!customer) notFound();

  const canViewFull = canViewFullPhone(session?.user.roles ?? []);
  const canDelete = session?.user.permissions.includes("DELETE_CUSTOMERS") ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CustomerStatusBadge status={customer.status} />
            {customer.platform ? <PlatformBadge platform={customer.platform} /> : null}
            {customer.isDuplicate ? <Badge variant="destructive">سجل مكرر</Badge> : null}
            <Badge variant={customer.phoneValidity === "VALID" ? "success" : "destructive"}>
              {PHONE_VALIDITY_LABELS[customer.phoneValidity as keyof typeof PHONE_VALIDITY_LABELS] ?? customer.phoneValidity}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p dir="ltr" className="text-end text-sm text-muted-foreground">
            {displayPhone(customer.normalizedPhone ?? customer.originalPhone, canViewFull)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomerStatusSelect customerId={customer.id} status={customer.status} />
          {canDelete && <CustomerDeleteButton customerId={customer.id} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="القيمة المحتملة" value={formatCurrency(customer.potentialValue)} />
        <StatCard label="قيمة المشتريات" value={formatCurrency(customer.totalPurchaseValue)} />
        <StatCard label="عدد الزيارات" value={formatNumber(customer.visitCount)} />
        <StatCard label="آخر تواصل" value={customer.lastContactAt ? formatDate(customer.lastContactAt) : "—"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>بيانات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Mail} label="البريد الإلكتروني" value={customer.email ?? "—"} />
              <InfoRow icon={MapPin} label="المدينة" value={customer.city ?? "—"} />
              <InfoRow icon={Building2} label="الفرع" value={customer.branchName ?? "—"} />
              <InfoRow icon={Wrench} label="الخدمة المطلوبة" value={customer.serviceName ?? "—"} />
              <InfoRow icon={Megaphone} label="الحملة" value={customer.campaignName ?? "—"} />
              <InfoRow
                icon={Calendar}
                label="مصدر العميل"
                value={customer.source ? LEAD_SOURCE_LABELS[customer.source] : "—"}
              />
              <InfoRow
                icon={Calendar}
                label="أول تواصل"
                value={customer.firstContactAt ? formatDate(customer.firstContactAt) : "—"}
              />
              <InfoRow
                icon={Calendar}
                label="آخر عملية شراء"
                value={customer.lastPurchaseAt ? formatDate(customer.lastPurchaseAt) : "—"}
              />
              <InfoRow icon={Building2} label="الموظف المسؤول" value={customer.ownerName ?? "—"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الوسوم</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerTagsEditor customerId={customer.id} tags={customer.tags} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <CustomerConsentToggle customerId={customer.id} consent={customer.marketingConsent} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <CustomerNotesForm customerId={customer.id} initialNote={customer.notes} />

          <Card>
            <CardHeader>
              <CardTitle>سجل الإجراءات</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerActivityTimeline activities={customer.activities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
