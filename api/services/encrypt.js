var crypto = require("crypto");
var CryptoJS = require("crypto-js");
var key = sails.config.globals.encryptKey;
var iv = sails.config.globals.encryptIV;
const secretKey = "secret key 123";

module.exports = {
  //Not used
  encrypt: (plainText) => {
    var cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    var cipherText = cipher.update(plainText, "utf8", "base64");
    cipherText += cipher.final("base64");
    return cipherText;
  },

  //Not used
  decrypt: (msg) => {
    if (msg) {
      var decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
      var decoced = decipher.update(msg, "base64");
      decoced += decipher.final();
      return decoced;
    }
    return;
  },

  // Function to encrypt data
  encryptMsg: (data) => {
    const encryptedData = CryptoJS.AES.encrypt(data, secretKey).toString();
    return encryptedData;
  },

  // Function to decrypt data
  decryptMsg: (encryptedData) => {
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedData;
  },
};
