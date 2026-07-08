const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jqnyjgjvvcsquszihkcj:eqhwwtew3y3KflyT@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  try {
    console.log("Connecting to us-east-1 pooler...");
    const count = await prisma.user.count();
    console.log("Connected successfully! count:", count);
  } catch (err) {
    console.error("Failed to connect:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
