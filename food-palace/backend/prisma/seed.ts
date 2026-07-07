import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const flags = [
    'maintenanceMode',
    'demoMode',
    'onlineOrdering',
    'pickup',
    'delivery',
    'notifications',
  ];

  for (const key of flags) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: {},
      create: { key, enabled: false },
    });
  }

  console.log('✅ Feature flags seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
