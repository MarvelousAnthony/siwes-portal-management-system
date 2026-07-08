const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.log('❌ Error: Please provide a password to hash.');
  console.log('Usage: node hash.js YOUR_PASSWORD');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\n========================================');
console.log('🔒 PASSWORD HASH GENERATED SUCCESSFULLY');
console.log('========================================');
console.log(`Plain Text: ${password}`);
console.log(`Bcrypt Hash: ${hash}`);
console.log('========================================\n');
console.log('Copy the Bcrypt Hash and paste it directly into your Supabase passwordHash column.');
