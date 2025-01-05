var jwt = require('jsonwebtoken');

var tokenauth = {
  generateToken: function (payload) {
    console.log("in generateToken ", payload)
    return jwt.sign(payload, sails.config.session.tokenSecret, {
      expiresIn: sails.config.session.tokenExpire,
    });
  },

  verifyToken: function (token, cb) {
    // console.log("token========", token)
    return jwt.verify(token, sails.config.session.tokenSecret, {}, cb);
  },

  getSessionFromToken: function (token) {
    var payload = jwt.decode(token, sails.config.session.tokenSecret);
    return payload;
  },

};

module.exports = tokenauth;
