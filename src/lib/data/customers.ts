import { prisma } from "@/lib/prisma";
import type { CustomerStatus, LeadSource, Platform, Prisma } from "@prisma/client";

export interface CustomerListRow {
  id: string;
  name: string;
  originalPhone: string;
  normalizedPhone: string | null;
  phoneValidity: string;
  email: string | null;
  city: string | null;
  branchName: string | null;
  source: LeadSource | null;
  platform: Platform | null;
  campaignName: string | null;
  serviceName: string | null;
  status: CustomerStatus;
  potentialValue: number;
  totalPurchaseValue: number;
  visitCount: number;
  firstContactAt: Date | null;
  lastContactAt: Date | null;
  lastPurchaseAt: Date | null;
  ownerName: string | null;
  tags: string[];
  marketingConsent: boolean;
  isDuplicate: boolean;
  createdAt: Date;
}

export interface CustomerListFilters {
  status?: string;
  branchId?: string;
  serviceId?: string;
  platform?: string;
  source?: string;
  city?: string;
  phoneValidity?: string;
  tag?: string;
}

function buildCustomerWhere(filters: CustomerListFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (filters.status) where.status = filters.status as CustomerStatus;
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.platform) where.platform = filters.platform as Platform;
  if (filters.source) where.source = filters.source as LeadSource;
  if (filters.city) where.city = filters.city;
  if (filters.phoneValidity) where.phoneValidity = filters.phoneValidity as never;
  if (filters.tag) where.tags = { some: { tag: { name: filters.tag } } };
  return where;
}

export async function getCustomersList(filters: CustomerListFilters = {}): Promise<CustomerListRow[]> {
  const customers = await prisma.customer.findMany({
    where: buildCustomerWhere(filters),
    include: {
      branch: true,
      service: true,
      campaign: true,
      owner: true,
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return customers.map((c) => ({
    id: c.id,
    name: c.name,
    originalPhone: c.originalPhone,
    normalizedPhone: c.normalizedPhone,
    phoneValidity: c.phoneValidity,
    email: c.email,
    city: c.city,
    branchName: c.branch?.name ?? null,
    source: c.source,
    platform: c.platform,
    campaignName: c.campaign?.name ?? null,
    serviceName: c.service?.nameAr ?? null,
    status: c.status,
    potentialValue: Number(c.potentialValue),
    totalPurchaseValue: Number(c.totalPurchaseValue),
    visitCount: c.visitCount,
    firstContactAt: c.firstContactAt,
    lastContactAt: c.lastContactAt,
    lastPurchaseAt: c.lastPurchaseAt,
    ownerName: c.owner?.name ?? null,
    tags: c.tags.map((t) => t.tag.name),
    marketingConsent: c.marketingConsent,
    isDuplicate: c.isDuplicate,
    createdAt: c.createdAt,
  }));
}

export interface CustomerActivityRow {
  id: string;
  type: string;
  description: string;
  createdAt: Date;
}

export interface CustomerDetail extends Omit<CustomerListRow, "tags"> {
  notes: string | null;
  duplicateOfId: string | null;
  activities: CustomerActivityRow[];
  branchId: string | null;
  serviceId: string | null;
  campaignId: string | null;
  tags: Array<{ id: string; name: string }>;
}

export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const c = await prisma.customer.findUnique({
    where: { id },
    include: {
      branch: true,
      service: true,
      campaign: true,
      owner: true,
      tags: { include: { tag: true } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c || c.deletedAt) return null;

  return {
    id: c.id,
    name: c.name,
    originalPhone: c.originalPhone,
    normalizedPhone: c.normalizedPhone,
    phoneValidity: c.phoneValidity,
    email: c.email,
    city: c.city,
    branchName: c.branch?.name ?? null,
    branchId: c.branchId,
    source: c.source,
    platform: c.platform,
    campaignName: c.campaign?.name ?? null,
    campaignId: c.campaignId,
    serviceName: c.service?.nameAr ?? null,
    serviceId: c.serviceId,
    status: c.status,
    potentialValue: Number(c.potentialValue),
    totalPurchaseValue: Number(c.totalPurchaseValue),
    visitCount: c.visitCount,
    firstContactAt: c.firstContactAt,
    lastContactAt: c.lastContactAt,
    lastPurchaseAt: c.lastPurchaseAt,
    ownerName: c.owner?.name ?? null,
    tags: c.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
    marketingConsent: c.marketingConsent,
    isDuplicate: c.isDuplicate,
    duplicateOfId: c.duplicateOfId,
    notes: c.notes,
    createdAt: c.createdAt,
    activities: c.activities.map((a) => ({ id: a.id, type: a.type, description: a.description, createdAt: a.createdAt })),
  };
}

export async function getAllTags() {
  return prisma.tag.findMany({ orderBy: { name: "asc" } });
}

export async function getCustomerFilterOptions() {
  const [branches, services, cities] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { deletedAt: null }, orderBy: { nameAr: "asc" } }),
    prisma.customer.findMany({
      where: { deletedAt: null, city: { not: null } },
      distinct: ["city"],
      select: { city: true },
    }),
  ]);

  const platforms: Array<{ value: Platform; label: string }> = [
    { value: "META_ADS", label: "Meta Ads" },
    { value: "FACEBOOK", label: "Facebook" },
    { value: "INSTAGRAM", label: "Instagram" },
    { value: "TIKTOK_ADS", label: "TikTok Ads" },
    { value: "SNAPCHAT_ADS", label: "Snapchat Ads" },
    { value: "GOOGLE_ADS", label: "Google Ads" },
  ];

  return {
    branches: branches.map((b) => ({ label: b.name, value: b.id })),
    services: services.map((s) => ({ label: s.nameAr, value: s.id })),
    platforms,
    cities: cities.filter((c): c is { city: string } => Boolean(c.city)).map((c) => ({ label: c.city, value: c.city })),
  };
}
