import { PrismaClient } from "@prisma/client";
import { seedCore } from "./seed/core";
import { seedAccounts, seedAccountStats } from "./seed/accounts";
import { seedAdCampaigns } from "./seed/ads";
import { seedContent } from "./seed/content";
import { seedInbox } from "./seed/inbox";
import { seedCrm } from "./seed/crm";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Marketing — Social Command Center...");
  const { workspaces, users } = await seedCore(prisma);
  const accounts = await seedAccounts(prisma, workspaces);
  await seedAccountStats(
    prisma,
    accounts.map((a) => ({ id: a.id, followers: a.followers, platform: a.platform }))
  );
  await seedAdCampaigns(prisma, workspaces, accounts);
  await seedContent(prisma, workspaces, accounts, users);
  await seedInbox(prisma, workspaces, accounts, users);
  const campaigns = await prisma.adCampaign.findMany();
  await seedCrm(prisma, workspaces, users, campaigns);
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
