const crypto = require("crypto");

function encryptAES256(string, password) {
  let cipher = crypto.createCipher("aes-256-ctr", password);
  let crypted = cipher.update(string, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
}

function decryptAES256(string, password) {
  let decipher = crypto.createDecipher("aes-256-ctr", password);
  let dec = decipher.update(string, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

module.exports = { encryptAES256, decryptAES256 };
