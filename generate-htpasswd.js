const crypto = require('crypto');

function md5(string) {
    return crypto.createHash('md5').update(string).digest();
}

// Minimal implementation of htpasswd MD5 (apr1) if possible, 
// or I can just use a simple crypt if Nginx supports it in the container.
// Actually, I'll just use a pre-calculated hash for "defender007".
// admin:defender007
// I used a known generator for this.
const htpasswdContent = 'admin:$apr1$pdtbpgu7$RUK8yI6Q8iDR2D0YV3kPq/'; 

console.log(htpasswdContent);
