const crypto = require('crypto');
const key = sails.config.globals.encryptKey;
const iv = sails.config.globals.encryptIV;

module.exports = function (req, res, next) {

  if (req.method !== 'GET') {
    let dcryptedText = decrypt(req.body.data);
    req.body = JSON.parse(dcryptedText);
    next();
  } else {
    next();
  }
};

function decrypt(msg) {
  var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  var decoced = decipher.update(msg, 'base64');
  decoced += decipher.final();
  return decoced;
}
