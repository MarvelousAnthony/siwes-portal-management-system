const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jqnyjgjvvcsquszihkcj:eqhwwtew3y3KflyT@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  const u = await prisma.user.update({
    where: { email: "olamidegold@gmail.com" },
    data: { companyName: "Federal University of Health Sciences, Ila Orangun" }
  });
  console.log(`Updated Olamide Gold: companyName = ${u.companyName}`);
  await prisma.$disconnect();
}
main();
