/**
 * Chat.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    participates: {
      collection: "Users",
    },
    participatesArray: {
      type: "json",
      defaultsTo: [],
    },
    groupImage: {
      type: "String",
      defaultsTo: "",
    },
    groupName: {
      type: "String",
      defaultsTo: "",
    },
    isGroup: {
      type: "boolean",
      defaultsTo: false,
    },
    archiveBy: {
      type: "json",
      defaultsTo: [],
    },
    deletedBy: {
      type: "json",
      defaultsTo: [],
    },
    isActive: {
      type: "boolean",
      defaultsTo: false,
    },
    adminList: {
      type: "json",
      defaultsTo: [],
    },
    lastMessageId: {
      type: "String",
      defaultsTo: "",
    },
    unreadMessageCount: {
      type: "json",
      defaultsTo: {},
    }
  },
};
