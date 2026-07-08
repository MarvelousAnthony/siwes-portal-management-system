const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jqnyjgjvvcsquszihkcj:eqhwwtew3y3KflyT@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});
async function main() {
  console.log("Updating supervisor records...");
  
  // 1. Olamide Gold (olamidegold@gmail.com) -> Company: Federal University of Health Sciences
  const u1 = await prisma.user.update({
    where: { email: "olamidegold@gmail.com" },
    data: { companyName: "Federal University of Health Sciences" }
  });
  console.log(`Updated Olamide Gold: companyName = ${u1.companyName}`);

  // 2. Oyewole Grace (marvelousoluwatoyin@gmail.com) -> Company: SQI College
  const u2 = await prisma.user.update({
    where: { email: "marvelousoluwatoyin@gmail.com" },
    data: { companyName: "SQI College" }
  });
  console.log(`Updated Oyewole Grace: companyName = ${u2.companyName}`);

  // 3. Oladele Stella (oladelestella@gmail.com) -> Institution: Adeleke University
  const u3 = await prisma.user.update({
    where: { email: "oladelestella@gmail.com" },
    data: { institution: "Adeleke University" }
  });
  console.log(`Updated Oladele Stella: institution = ${u3.institution}`);

  // 4. Fadayomi Funmilayo (fadayomifunmilayo@gmail.com) -> Institution: Redeemers University
  const u4 = await prisma.user.update({
    where: { email: "fadayomifunmilayo@gmail.com" },
    data: { institution: "Redeemers University" }
  });
  console.log(`Updated Fadayomi Funmilayo: institution = ${u4.institution}`);

  console.log("Database update completed successfully!");
  await prisma.$disconnect();
}
main();
