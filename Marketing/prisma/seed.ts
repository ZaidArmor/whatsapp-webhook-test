import { PrismaClient } from "@prisma/client";
import { seedCore } from "./seed/core";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Marketing — Social Command Center...");
  await seedCore(prisma);
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
