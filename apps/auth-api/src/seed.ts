import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DEMO_USER_ID } from './auth/key-store';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env.SEED !== 'true') {
    console.log('Semilla de identidad omitida.');
    return;
  }
  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      email: 'demo@profelink.dev',
      displayName: 'Profe Demo',
      passwordHash,
    },
    create: {
      id: DEMO_USER_ID,
      email: 'demo@profelink.dev',
      displayName: 'Profe Demo',
      passwordHash,
    },
  });
  console.log('Perfil demo listo: demo@profelink.dev');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
