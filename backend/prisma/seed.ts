import 'dotenv/config';

const { PrismaClient } = require('../generated/prisma/client.js');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL not found in environment variables or .env file');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

async function main() {
  const email = process.env.SUPERADMIN_EMAIL ?? 'superadmin@gate-qris.com';
  const password = process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin123!';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Superadmin already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });

  console.log(`Superadmin created successfully: ${email}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed superadmin user', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
