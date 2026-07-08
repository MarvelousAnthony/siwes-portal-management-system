const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  try {
    console.log("Connecting to Supabase...");
    const usersCount = await prisma.user.count();
    console.log("Connection successful! Total users in database:", usersCount);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
