const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:eqhwwtew3y3KflyT@db.jqnyjgjvvcsquszihkcj.supabase.co:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  try {
    const count = await prisma.user.count();
    console.log("Connected to 6543 successfully! count:", count);
  } catch (err) {
    console.error("Failed to connect to 6543:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
