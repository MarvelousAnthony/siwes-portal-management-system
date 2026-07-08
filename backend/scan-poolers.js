const { PrismaClient } = require("@prisma/client");

const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1', 'ca-central-1'
];

async function testRegion(region) {
  const url = `postgresql://postgres.jqnyjgjvvcsquszihkcj:eqhwwtew3y3KflyT@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });
  try {
    const count = await prisma.user.count();
    console.log(`🎉 SUCCESS: ${region} connected successfully! count: ${count}`);
    return true;
  } catch (err) {
    // console.log(`Failed for ${region}: ${err.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Scanning regional poolers for success...");
  for (const r of regions) {
    console.log(`Testing ${r}...`);
    const success = await testRegion(r);
    if (success) {
      console.log(`Found it! The region is ${r}.`);
      break;
    }
  }
  console.log("Scan complete.");
}
main();
