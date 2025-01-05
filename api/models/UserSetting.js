/**
 * UserSetting.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user: {
      model: "Users",
      unique: true,
    },
    deletedSchedule: {
      type: "string",
      defaultsTo: "",
    },
    prevRunAt: {
      type: "number",
    },
    nextRunAt: {
      type: "number",
    },
    deleteFromApp: {
      type: "boolean",
      defaultsTo: false,
    },
    isDeleteScheduleActive: {
      type: "boolean",
      defaultsTo: false,
    },
  },
};
