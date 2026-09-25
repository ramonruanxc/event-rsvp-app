import { PrismaClient } from '@prisma/client';
import { seedDemo } from '../src/lib/demo-seed';

const prisma = new PrismaClient();

seedDemo(prisma, new Date())
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
