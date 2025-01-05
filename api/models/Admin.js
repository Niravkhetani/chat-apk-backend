/**
 * Admin.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    username: {
      type: 'string', 
      required: true,
      unique: true,
    },
    password: {
      type: 'string',
      required: true,
    },
    token: {
      type: 'string',
      defaultsTo: "",
    },
    tokenExpire: {
      type: 'string',
      defaultsTo: "",
    },
    type: {
      type: 'string',
      defaultsTo: 'admin',
      isIn: ['admin', 'superAdmin'],
    }
  },

};

