const Joi = require("joi");

const generatePasswordCode = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      userName: Joi.string().required(),
    });

    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};

module.exports = {generatePasswordCode};
