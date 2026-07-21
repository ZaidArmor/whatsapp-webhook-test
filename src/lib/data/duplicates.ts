import { prisma } from "@/lib/prisma";

export interface DuplicateMember {
  id: string;
  name: string;
  originalPhone: string;
  normalizedPhone: string | null;
  email: string | null;
  status: string;
  branchName: string | null;
  createdAt: Date;
  completeness: number;
}

export interface DuplicateGroup {
  key: string;
  matchType: "phone" | "email";
  members: DuplicateMember[];
}

function completenessScore(c: {
  email: string | null;
  city: string | null;
  branchId: string | null;
  serviceId: string | null;
  notes: string | null;
  potentialValue: unknown;
}): number {
  let score = 0;
  if (c.email) score++;
  if (c.city) score++;
  if (c.branchId) score++;
  if (c.serviceId) score++;
  if (c.notes) score++;
  if (Number(c.potentialValue) > 0) score++;
  return score;
}

export async function getDuplicateGroups(): Promise<DuplicateGroup[]> {
  const customers = await prisma.customer.findMany({
    where: { deletedAt: null },
    include: { branch: true },
    orderBy: { createdAt: "asc" },
  });

  const byPhone = new Map<string, typeof customers>();
  const byEmail = new Map<string, typeof customers>();

  for (const c of customers) {
    if (c.normalizedPhone) {
      const list = byPhone.get(c.normalizedPhone) ?? [];
      list.push(c);
      byPhone.set(c.normalizedPhone, list);
    } else if (c.email) {
      const list = byEmail.get(c.email) ?? [];
      list.push(c);
      byEmail.set(c.email, list);
    }
  }

  const groups: DuplicateGroup[] = [];

  for (const [phone, members] of byPhone.entries()) {
    if (members.length < 2) continue;
    groups.push({
      key: phone,
      matchType: "phone",
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        originalPhone: m.originalPhone,
        normalizedPhone: m.normalizedPhone,
        email: m.email,
        status: m.status,
        branchName: m.branch?.name ?? null,
        createdAt: m.createdAt,
        completeness: completenessScore(m),
      })),
    });
  }

  for (const [email, members] of byEmail.entries()) {
    if (members.length < 2) continue;
    groups.push({
      key: email,
      matchType: "email",
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        originalPhone: m.originalPhone,
        normalizedPhone: m.normalizedPhone,
        email: m.email,
        status: m.status,
        branchName: m.branch?.name ?? null,
        createdAt: m.createdAt,
        completeness: completenessScore(m),
      })),
    });
  }

  return groups;
}
