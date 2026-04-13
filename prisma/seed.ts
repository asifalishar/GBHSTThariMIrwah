import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = 'superadmin';
  const plainPassword = 'Admin@12345';

  // Check if superadmin already exists
  const existingSuperadmin = await prisma.user.findUnique({
    where: { username },
  });

  if (!existingSuperadmin) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const superadmin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        username: username,
        // Since we changed email to optional or at least not strictly required for superadmin, we can omit it if it's optional
        // or provide a placeholder if it's still needed, but the user requested "dont use email use only superadmin username".
        password: hashedPassword,
        role: 'ADMIN',
        requiresPasswordChange: true,
      },
    });
    console.log(`✅ Superadmin created with username: ${superadmin.username}`);
  } else {
    console.log('ℹ️ Superadmin already exists. Skipping seeding.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
