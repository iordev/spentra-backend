import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import { DEFAULT_PERMISSIONS, DEFAULT_ROLES } from './constants';
import { DEFAULT_OCCUPATIONS } from './constants/occupation';
import { DEFAULT_CURRENCIES } from './constants/currency';
import { DEFAULT_TIMEZONES } from './constants/timezone';
import { DEFAULT_COUNTRIES } from './constants/country';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not defined');
}
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function truncateTables() {
  console.log('🗑️  Truncating tables...');

  // Order matters due to foreign key constraints
  // Disconnect many-to-many first, then dependent tables
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "_PermissionToRole" RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "UserAuth"          RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User"              RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Permission"        RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Role"              RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Occupation"        RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Currency"          RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Timezone"          RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Country"           RESTART IDENTITY CASCADE`);

  console.log('✅ Tables truncated.');
}

async function seedPermissions() {
  console.log('🌱 Seeding permissions...');

  for (const permission of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: permission,
      create: permission,
    });
  }

  console.log(`✅ ${DEFAULT_PERMISSIONS.length} permissions seeded.`);
}

async function seedRoles() {
  console.log('🌱 Seeding roles...');

  for (const role of DEFAULT_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        description: role.description,
        permissions: {
          // disconnect all first, then reconnect
          set: role.permissions.map((name) => ({ name })),
        },
      },
      create: {
        name: role.name,
        description: role.description,
        permissions: {
          connect: role.permissions.map((name) => ({ name })),
        },
      },
    });
  }

  console.log(`✅ ${DEFAULT_ROLES.length} roles seeded.`);
}

async function seedOccupations() {
  console.log('🌱 Seeding occupations...');

  for (const occupation of DEFAULT_OCCUPATIONS) {
    await prisma.occupation.upsert({
      where: { name: occupation.name },
      update: occupation,
      create: occupation,
    });
  }

  console.log(`✅ ${DEFAULT_OCCUPATIONS.length} occupations seeded.`);
}

async function seedCurrencies() {
  console.log('🌱 Seeding currencies...');

  for (const currency of DEFAULT_CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: currency,
      create: currency,
    });
  }

  console.log(`✅ ${DEFAULT_CURRENCIES.length} currencies seeded.`);
}

async function seedTimezones() {
  console.log('🌱 Seeding timezones...');

  for (const timezone of DEFAULT_TIMEZONES) {
    await prisma.timezone.upsert({
      where: { name: timezone.name },
      update: timezone,
      create: timezone,
    });
  }

  console.log(`✅ ${DEFAULT_TIMEZONES.length} timezones seeded.`);
}

async function seedCountries() {
  console.log('🌱 Seeding countries...');

  for (const country of DEFAULT_COUNTRIES) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: country,
      create: country,
    });
  }

  console.log(`✅ ${DEFAULT_COUNTRIES.length} countries seeded.`);
}

async function main() {
  await truncateTables();
  await seedPermissions();
  await seedRoles();
  await seedOccupations();
  await seedCurrencies();
  await seedTimezones();
  await seedCountries();
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
