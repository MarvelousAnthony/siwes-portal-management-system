import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Starting Row-Level Security (RLS) enforcement script...");

  // Query all tables in the public schema
  const tablesResult: any[] = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public';
  `);

  const tables = tablesResult.map((t) => t.tablename);
  console.log(`Found ${tables.length} tables in public schema:`, tables);

  for (const table of tables) {
    if (table.startsWith("_prisma")) {
      console.log(`Skipping migration table: ${table}`);
      continue;
    }
    console.log(`Enforcing RLS on table: "${table}"...`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
    `);
    console.log(`✅ RLS enabled on table: "${table}"`);
  }

  console.log("🎉 All tables successfully secured with RLS!");
}

main()
  .catch((e) => {
    console.error("❌ RLS enforcement failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
