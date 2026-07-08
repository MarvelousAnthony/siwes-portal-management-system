const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jqnyjgjvvcsquszihkcj:eqhwwtew3y3KflyT@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  const users = await prisma.user.findMany();
  console.log("Current users in database:");
  users.forEach(u => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.firstName} ${u.lastName} | Role: ${u.role} | Company: ${u.companyName} | Inst: ${u.institution}`);
  });
  await prisma.$disconnect();
}
main();
