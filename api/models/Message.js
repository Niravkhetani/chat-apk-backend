/**
 * Message.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    messageText: {
      type: "string",
    },
    realmId: {
      type: "string",
      required: true,
    },
    messageType: {
      type: "string",
      defaultsTo: "TEXT",
      isIn: ["TEXT", "IMAGE", "CONTACT", "LOG"],
    },
    sender: {
      model: "Users",
      required: true,
    },
    replyOn: {
      // model: "Message",
      type: "json",
      defaultsTo: {},
    },
    messageMedia: {
      type: "string",
    },
    chatId: {
      model: "Chat",
    },
    seenFlag: {
      type: "boolean",
      defaultsTo: false,
    },
    isReceived: {
      type: "boolean",
      defaultsTo: false,
    },
    isForwarded: {
      type: "boolean",
      defaultsTo: false,
    },
    isSpam: {
      type: "boolean",
      defaultsTo: false,
    },
    spamText: {
      type: "string",
    },
    reportMeta: {
      type: "json",
      defaultsTo: {},
    },
    senderName: {
      type: "string",
    },
    timeStamp: {
      type: "number",
    },
    deletedFor: {
      type: "json",
      defaultsTo: [],
    },
    userName: {
      type: "string",
    },
    isGroup: {
      type: "boolean",
    },
    isSent: {
      type: "boolean",
      defaultsTo: true,
    },
    isFailed: {
      type: "boolean",
      defaultsTo: false,
    },
    mediaEncrypted: {
      type: "boolean",
      defaultsTo: false,
    }
  },
};
