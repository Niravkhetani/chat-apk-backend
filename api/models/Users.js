/**
 * Users.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const {ResetPasswordDefault} = require("../constants/UserConstant");

module.exports = {
  attributes: {
    fullName: {
      type: "String",
      // required: true,
    },
    phoneNumber: {
      type: "string",
      //   required: true,
      //   unique: true,
    },
    token: {
      type: "string",
    },
    deviceToken: {
      type: "string",
      defaultsTo: "",
      // required: true,
    },
    profilePic: {
      type: "String",
      defaultsTo: "",
    },
    otp: {
      type: "String",
      defaultsTo: "",
    },
    isVerified: {
      type: "boolean",
      defaultsTo: false,
    },
    contacts: {
      type: "json",
      defaultsTo: [],
    },
    countryCode: {
      type: "string",
      //   required: true,
    },
    blockedUser: {
      collection: "Users",
    },
    blockedUsers: {
      type: "json",
      defaultsTo: [],
    },
    reportedBy: {
      collection: "Users",
    },
    safetyNumber: {
      type: "string",
      // required: true,
    },
    lastSeen: {
      type: "string",
      isIn: ["Everyone", "My Contacts", "Nobody"],
      defaultsTo: "Everyone",
    },
    profile: {
      type: "string",
      isIn: ["Everyone", "My Contacts", "Nobody"],
      defaultsTo: "Everyone",
    },
    about: {
      type: "string",
      isIn: ["Everyone", "My Contacts", "Nobody"],
      defaultsTo: "Everyone",
    },
    group: {
      type: "string",
      isIn: ["Everyone", "My Contacts", "Nobody"],
      defaultsTo: "Everyone",
    },
    isReadReceipt: {
      type: "boolean",
      defaultsTo: true,
    },
    isDeleted: {
      type: "boolean",
      defaultsTo: false,
    },
    deactivated: {
      type: "boolean",
      defaultsTo: false,
    },
    info: {
      type: "string",
      defaultsTo: "Hey there, i am using Razgovor Chat!",
    },
    lastSeenTime: {
      type: "string",
      defaultsTo: "",
    },
    notificationSound: {
      type: "boolean",
      defaultsTo: true,
    },
    isReported: {
      type: "boolean",
      defaultsTo: false,
    },
    reportMeta: {
      type: "json",
      defaultsTo: [],
    },
    isBanned: {
      type: "boolean",
      defaultsTo: false,
    },
    suspendMeta: {
      type: "json",
      // required: false,
      defaultsTo: {},
    },
    globalPhoneNumber: {
      type: "string",
      defaultsTo: "",
    },
    userName: {
      type: "string",
      required: true,
      unique: true,
    },
    password: {
      type: "string",
      required: true,
      unique: true,
    },
    resetPassword: {
      type: "string",
      required: false,
      defaultsTo: ResetPasswordDefault,
    },
    userSetting: {
      model: "UserSetting",
    },
  },
  //model validation messages definitions
  validationMessages: {
    phoneNumber: {
      required: "Phone number is required",
      unique: "Phone number is already in use",
    },
    fullName: {
      required: "Fullname is required",
    },
  },
};
