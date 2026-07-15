import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Revoking PUBLIC execute access from security definer function 'rls_auto_enable'...");

  // Revoke execute on the function from PUBLIC, anon, and authenticated roles
  await prisma.$executeRawUnsafe(`
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  `);

  console.log("✅ Execute privilege revoked from PUBLIC, anon, and authenticated for 'rls_auto_enable()'.");
}

main()
  .catch((e) => {
    console.error("❌ Failed to revoke function execute privileges:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
