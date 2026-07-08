const dns = require('dns');
dns.resolveCname('db.jqnyjgjvvcsquszihkcj.supabase.co', (err, addresses) => {
  console.log('CNAME:', addresses || err);
});
