// Hash and Salt a given password
// Usage = node salt.js user password

const crypto = require("crypto");
const { exit } = require("process");

if(process.argv.length != 4)
{
    console.error("Usage = node salt.js user password");
    exit(1);
}

user = process.argv[2];
password = process.argv[3];

var salt = crypto.randomBytes(128).toString('base64');
var iterations = 10000;
var hash = crypto.pbkdf2Sync(password, salt, iterations, 512, 'sha512').toString('base64');

console.log('{"user": "' + user + '", "hash": "' + hash + '", "salt": "' + salt + '", "saltiness": ' + iterations + '}');

