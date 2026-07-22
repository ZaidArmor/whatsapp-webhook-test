import { prisma } from "@/lib/prisma";
import type { SegmentConditionField, SegmentConditionOperator, SegmentLogicalOperator } from "@prisma/client";
import { evaluateTree, type SegmentEvaluableCustomer } from "@/lib/segments/evaluate";
import type { SegmentConditionInput, SegmentGroupInput, SegmentTreeInput } from "@/lib/segments/types";

export interface EvaluableCustomerRow extends SegmentEvaluableCustomer {
  id: string;
  name: string;
  originalPhone: string;
  normalizedPhone: string | null;
  email: string | null;
}

export async function getEvaluableCustomers(): Promise<EvaluableCustomerRow[]> {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    include: { tags: { include: { tag: true } } },
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    originalPhone: c.originalPhone,
    normalizedPhone: c.normalizedPhone,
    email: c.email,
    city: c.city,
    branchId: c.branchId,
    serviceId: c.serviceId,
    campaignId: c.campaignId,
    platform: c.platform,
    source: c.source,
    status: c.status,
    totalPurchaseValue: Number(c.totalPurchaseValue),
    lastPurchaseAt: c.lastPurchaseAt,
    lastContactAt: c.lastContactAt,
    firstContactAt: c.firstContactAt,
    marketingConsent: c.marketingConsent,
    isDuplicate: c.isDuplicate,
    phoneValidity: c.phoneValidity,
    tagNames: c.tags.map((t) => t.tag.name),
  }));
}

export async function evaluateSegmentTree(tree: SegmentTreeInput): Promise<EvaluableCustomerRow[]> {
  const customers = await getEvaluableCustomers();
  return customers.filter((c) => evaluateTree(c, tree));
}

export interface SegmentListRow {
  id: string;
  name: string;
  description: string | null;
  customerCountCache: number;
  isArchived: boolean;
  ownerName: string;
  updatedAt: Date;
}

export async function getSegmentsList(): Promise<SegmentListRow[]> {
  const segments = await prisma.segment.findMany({
    include: { user: true },
    orderBy: { updatedAt: "desc" },
  });

  return segments.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    customerCountCache: s.customerCountCache,
    isArchived: s.isArchived,
    ownerName: s.user.name,
    updatedAt: s.updatedAt,
  }));
}

interface SegmentConditionNode {
  id: string;
  parentId: string | null;
  logicalOperator: SegmentLogicalOperator;
  field: SegmentConditionField | null;
  operator: SegmentConditionOperator | null;
  value: unknown;
}

function buildTreeFromNodes(nodes: SegmentConditionNode[]): SegmentTreeInput {
  const root = nodes.find((n) => n.parentId === null);
  if (!root) return { topLogicalOperator: "AND", groups: [] };

  const groupNodes = nodes.filter((n) => n.parentId === root.id);
  const groups: SegmentGroupInput[] = groupNodes.map((groupNode) => {
    const leafNodes = nodes.filter((n) => n.parentId === groupNode.id);
    const conditions: SegmentConditionInput[] = leafNodes
      .filter((leaf) => leaf.field && leaf.operator)
      .map((leaf) => ({
        id: leaf.id,
        field: leaf.field as SegmentConditionField,
        operator: leaf.operator as SegmentConditionOperator,
        value: leaf.value as SegmentConditionInput["value"],
      }));
    return { id: groupNode.id, logicalOperator: groupNode.logicalOperator, conditions };
  });

  return { topLogicalOperator: root.logicalOperator, groups };
}

export interface SegmentDetail {
  id: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  tree: SegmentTreeInput;
}

export async function getSegmentBuilderOptions() {
  const [branches, services, campaigns] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null } }),
    prisma.service.findMany({ where: { deletedAt: null } }),
    prisma.campaign.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
  ]);

  return {
    branches: branches.map((b) => ({ value: b.id, label: b.name })),
    services: services.map((s) => ({ value: s.id, label: s.nameAr })),
    campaigns: campaigns.map((c) => ({ value: c.id, label: c.name })),
    platforms: [
      { value: "META_ADS", label: "Meta Ads" },
      { value: "FACEBOOK", label: "Facebook" },
      { value: "INSTAGRAM", label: "Instagram" },
      { value: "TIKTOK_ADS", label: "TikTok Ads" },
      { value: "SNAPCHAT_ADS", label: "Snapchat Ads" },
      { value: "GOOGLE_ADS", label: "Google Ads" },
    ],
    sources: [
      { value: "FACEBOOK", label: "فيسبوك" },
      { value: "INSTAGRAM", label: "إنستغرام" },
      { value: "TIKTOK", label: "تيك توك" },
      { value: "SNAPCHAT", label: "سناب شات" },
      { value: "GOOGLE", label: "جوجل" },
      { value: "WHATSAPP", label: "واتساب" },
      { value: "WEBSITE", label: "الموقع الإلكتروني" },
      { value: "WALK_IN", label: "زيارة مباشرة" },
      { value: "REFERRAL", label: "إحالة" },
      { value: "CALL_CENTER", label: "مركز الاتصال" },
      { value: "OTHER", label: "أخرى" },
    ],
    statuses: [
      { value: "NEW", label: "جديد" },
      { value: "CONTACTED", label: "تم التواصل" },
      { value: "INTERESTED", label: "مهتم" },
      { value: "QUOTE_REQUESTED", label: "طلب عرض سعر" },
      { value: "BOOKED", label: "حجز موعد" },
      { value: "ATTENDED", label: "حضر" },
      { value: "SOLD", label: "تم البيع" },
      { value: "NO_ANSWER", label: "لم يرد" },
      { value: "NOT_INTERESTED", label: "غير مهتم" },
      { value: "POSTPONED", label: "مؤجل" },
      { value: "PAST_CUSTOMER", label: "عميل سابق" },
      { value: "RETARGETING_OPPORTUNITY", label: "فرصة إعادة استهداف" },
    ],
    phoneValidities: [
      { value: "VALID", label: "صحيح" },
      { value: "INVALID", label: "غير صحيح" },
      { value: "UNKNOWN", label: "غير معروف" },
    ],
  };
}

export async function getSegmentDetail(id: string): Promise<SegmentDetail | null> {
  const segment = await prisma.segment.findUnique({
    where: { id },
    include: { conditions: true },
  });
  if (!segment) return null;

  return {
    id: segment.id,
    name: segment.name,
    description: segment.description,
    isArchived: segment.isArchived,
    tree: buildTreeFromNodes(segment.conditions),
  };
}
