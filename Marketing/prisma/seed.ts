import { PrismaClient } from "@prisma/client";
import { seedCore } from "./seed/core";
import { seedAccounts, seedAccountStats } from "./seed/accounts";
import { seedAdCampaigns } from "./seed/ads";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Marketing — Social Command Center...");
  const { workspaces } = await seedCore(prisma);
  const accounts = await seedAccounts(prisma, workspaces);
  await seedAccountStats(
    prisma,
    accounts.map((a) => ({ id: a.id, followers: a.followers, platform: a.platform }))
  );
  await seedAdCampaigns(prisma, workspaces, accounts);
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
