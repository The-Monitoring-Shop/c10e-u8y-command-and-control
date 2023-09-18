// Hash and Salt a given password
// Usage = node salt.js user password

const crypto = require("crypto");

if(process.argv.length != 4)
{
    console.error("Usage = node salt.js user password");
}

user = process.argv[2];
password = process.argv[3];
salt = 
saltiness = 

console.log(crypto.pbkdf2Sync(password, salt, saltiness, 512, 'sha512').toString('base64'));