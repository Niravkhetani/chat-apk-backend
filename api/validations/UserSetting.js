const Joi = require("joi");

const AutoDeleteOptions = sails.config.constants.AutoDeleteOptions;

const settingUpdateValidation = (body) => {
  const AutoDeleteOptionsArray = [0, 1, 2, 3, 7, 14];
  //   Object.entries(AutoDeleteOptions).forEach(([key, value]) => {
  //     AutoDeleteOptionsArray.push(value.name);
  //   });
  //   console.log("AutoDeleteOptionsArray", AutoDeleteOptionsArray);
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      deleteInterval: Joi.number().required().valid(AutoDeleteOptionsArray),
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

const settingDeleteValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      deleteFromApp: Joi.boolean().required(),
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

module.exports = {settingUpdateValidation, settingDeleteValidation};
