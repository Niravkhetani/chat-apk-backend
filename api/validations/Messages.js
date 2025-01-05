const Joi = require("joi");

const deleteMessageValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      deleteMessageUserId: Joi.array().required(),
      chatId: Joi.string(),
      messageRealmId: Joi.array(),
    });

    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("Delete Message validation", err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};

const reportMessageValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      realmId: Joi.string().required(),
      chatId: Joi.string().required(),
      reportedMessage: Joi.string().required(),
      reportedBy: Joi.string().required(),
      userName: Joi.string().required(),
    });
    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("Delete Message validation", err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};
module.exports = {
  deleteMessageValidation,
  reportMessageValidation,
};
