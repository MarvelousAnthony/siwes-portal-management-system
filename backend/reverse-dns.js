const dns = require('dns');
dns.reverse('2a05:d018:48a:c900:9454:686:6ae9:86ea', (err, hostnames) => {
  console.log('Hostnames:', hostnames || err);
});
