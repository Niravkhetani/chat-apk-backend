const Joi = require("joi");

const signupValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      fullName: Joi.string().required(),
      userName: Joi.string().required(),
      password: Joi.string().required(),
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
const loginValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      userName: Joi.string().required(),
      password: Joi.string().required().min(8),
    });
    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("Signup Validation error: " + err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};
const resetPasswordValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      userName: Joi.string().required(),
      ...(body.pinVerification
        ? {password: Joi.string().allow(["", null])}
        : {password: Joi.string().required().min(8)}),
      resetPasswordKey: Joi.string().required(),
      pinVerification: Joi.boolean(),
    });
    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("Reset Password validation Error: " + err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};

const changePasswordValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      userName: Joi.string().required(),
      password: Joi.string().required().min(8),
      existingPassword: Joi.string().required().min(8),
      changePassword: Joi.boolean().required(),
    });
    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("Reset Password validation Error: " + err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};

const getUserNamePasswordValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      fullName: Joi.string().allow([null, ""]),
      userName: Joi.string().required(),
    });
    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("Reset Password validation Error: " + err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};

const updateUserValidation = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      fullName: Joi.string(),
      deviceToken: Joi.string().allow(["", null]),
      notificationSound: Joi.boolean(),
      contacts: Joi.array(),
      profilePic: Joi.string(),
      blockedUsers: Joi.array(),
    });
    Joi.validate(body, schema, {convert: true}, (err, value) => {
      if (err && err.details) {
        console.log("update user validation Error: " + err);
        return reject(err.details[0]);
      } else {
        return resolve(value);
      }
    });
  });
};

const getUserList = (body) => {
  return new Promise((resolve, reject) => {
    const schema = Joi.object().keys({
      page: Joi.string(),
      limit: Joi.string(),
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

const getUserByName = (body) => {
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

module.exports = {
  signupValidation,
  loginValidation,
  resetPasswordValidation,
  getUserNamePasswordValidation,
  updateUserValidation,
  getUserList,
  getUserByName,
  changePasswordValidation,
};
