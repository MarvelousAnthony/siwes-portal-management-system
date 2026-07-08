const dns = require('dns');

const regions = [
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1', 'ca-central-1', 'me-central-1', 'af-south-1'
];

async function checkRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  return new Promise((resolve) => {
    dns.resolve4(host, (err, addresses) => {
      if (addresses) {
        console.log(`${region} (IPv4): ${addresses.join(', ')}`);
      } else {
        console.log(`${region} (IPv4): Error ${err.code}`);
      }
      resolve();
    });
  });
}

async function main() {
  console.log("Resolving regional pooler IPv4s...");
  for (const r of regions) {
    await checkRegion(r);
  }
}
main();
