/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {
  /***************************************************************************
   *                                                                          *
   * Make the view located at `views/homepage.ejs` your home page.            *
   *                                                                          *
   * (Alternatively, removeMedia this and add an `index.html` file in your         *
   * `assets` directory)                                                      *
   *                                                                          *
   ***************************************************************************/

  "/": {view: "pages/homepage"},
  // For UsersController Controller..
  "POST /api/loginUser": "UsersController.loginUser",
  "PUT /api/updateUser": "UsersController.updateUser",
  "POST /api/uploadProfileimage": "UsersController.uploadProfileimage",
  "POST /api/getAvailableUsers": "UsersController.getAvailableUsers",
  "PUT /api/userPrivacy": "UsersController.userPrivacy",
  "PUT /api/blockContacts": "UsersController.blockContacts",
  "PUT /api/unblockContacts": "UsersController.unblockContacts",
  "DELETE /api/deleteUser": "UsersController.deleteUser",
  "GET /api/getBlockedContacts": "UsersController.getBlockedContacts",
  "POST /api/getUserName": "UsersController.getUserName",
  "GET /api/users": "UsersController.getUsers",
  "GET /api/users/:userName": "UsersController.filterUserByName",
  "GET /api/validate-username/:userName": "UsersController.validateUserName",
  "GET /api/accountVerification/": "UsersController.accountVerification",

  //For update user settings
  "PUT /api/userSettings": "UserSettingController.updateUserSettings",

  //ADMIN PANEL APIS
  "GET /api/getUserAndMessageCount": "UsersController.getUserAndMessageCount", //Done
  "POST /api/getCurrentUsers": "UsersController.getCurrentUsers", //Done
  "GET /api/getUsersYearWise": "UsersController.getUsersYearWise",
  "POST /api/filterUserBySearch": "UsersController.filterUserBySearch",
  "POST /api/filterReportedUsersBySearch": "UsersController.filterReportedUsersBySearch",
  "POST /api/filterReportedMsgBySearch": "UsersController.filterReportedMsgBySearch",
  "POST /api/filterReportedUsersByDate": "UsersController.filterReportedUsersByDate",
  "POST /api/filterUsersByDate": "UsersController.filterUsersByDate", //penddingg
  "POST /api/getUserById": "UsersController.getUserById",
  "POST /api/postBanUser": "UsersController.postBanUser",
  "POST /api/postSuspendUser": "UsersController.postSuspendUser",
  "POST /api/postDeleteUser": "UsersController.postDeleteUser",
  "POST /api/postActivateUser": "UsersController.postActivateUser",
  "POST /api/postDeactivateUser": "UsersController.postDeactivateUser",
  "POST /api/postRemoveReportFlag": "UsersController.postRemoveReportFlag",
  "POST /api/editUser": "UsersController.editUser",
  "POST /api/registerUser": "UsersController.registerUser",
  "POST /api/resetUserPassword": "UsersController.resetPassword",
  "PUT /api/updateUserDefaultSettings": "UserSettingController.updateUserDefaultSettings",
  "PUT /api/updateUserDeleteSettingsFlag": "UserSettingController.updateUserDeleteSettingsFlag",
  "GET /api/getUserSettings": "UserSettingController.fetchUserSettings",

  // 'POST /api/postUpdateAppCofig' : 'UsersController.postUpdateAppCofig',

  // upload profile photo..
  // 'POST /api/uploadProfilePhoto': 'UsersController.uploadProfilePhoto',

  // For Chat Controller..
  "POST /api/createChat": "ChatController.createChat",
  "GET /api/getChat": "ChatController.getChat",
  "GET /api/getChatsById/:chatId": "ChatController.getChatsById",
  "PUT /api/uploadGroupImage": "ChatController.uploadGroupImage",
  "PUT /api/addUserToGroup": "ChatController.addUserToGroup",
  "PUT /api/removeUserFromGroup": "ChatController.removeUserFromGroup",
  "PUT /api/addAdminToGroup": "ChatController.addAdminToGroup",
  "PUT /api/removeAdminFromGroup": "ChatController.removeAdminFromGroup",
  "PUT /api/leaveFromGroup": "ChatController.leaveFromGroup",
  "PUT /api/updateGroupInfo/:chatId": "ChatController.updateGroupInfo",
  "GET /api/v2/getChat": "ChatController.getChatV2",
  "GET /api/v1/getUserChat": "ChatController.getUserChat",
  "GET /api/v1/getGroupChat": "ChatController.getGroupChat",
  "GET /api/v2/getChatById/:chatId": "ChatController.getChatsByIdV2",
  "POST /api/updateUnreadMessageCount/:chatId": "ChatController.updateUnreadMessageCount",

  //ADMIN PANEL APIS
  "POST /api/getAllGroups": "ChatController.getAllGroups", //Chat isGroup
  "GET /api/getGroupsYearWise": "ChatController.getGroupsYearWise", //Chat isGroup year

  // For Room Controller..
  "GET /api/room/connect/:userId": "RoomController.connect",
  "GET /api/room/disConnect/:roomId": "RoomController.disConnect",
  "POST /api/room/isTyping": "RoomController.isTyping",
  "POST /api/room/isOnline/:userId": "RoomController.isOnline",
  "PUT /api/room/updateConnection": "RoomController.updateConnection",

  // For message Controller..
  "POST /api/send_message/:chatId": "MessageController.sendMessage",
  "POST /api/uploadMediaBase64": "MessageController.uploadMediaBase64",
  "PUT /api/messageSeen": "MessageController.messageSeen",
  "POST /api/testFCM": "MessageController.testFCM",
  "GET /api/getSessions": "MessageController.getSessions",
  "DELETE /api/deleteMessageForEveryone": "MessageController.deleteMessageForEveryone",
  "PUT /api/uploadMedia": "MessageController.uploadMedia",
  "PUT /api/removeMedia": "MessageController.removeMedia",
  "DELETE /api/clearGroupChat": "MessageController.clearGroupChat",
  "DELETE /api/deleteChat": "MessageController.deleteChat",
  "PUT /api/reportMessage": "MessageController.reportMessage",

  //ADMIN PANEL APIS
  // 'POST /api/getTotalMsgs' : 'MessageController.getTotalMsgs',   //Message
  "POST /api/postSpamMsg": "MessageController.postSpamMsg", //mobile app api
  "POST /api/getAllSpammedMsgs": "MessageController.getAllSpammedMsgs", //Message isSpam
  "POST /api/postRemoveSpamFlag": "MessageController.postRemoveSpamFlag", //Message
  "POST /api/deleteSpamMsg": "MessageController.deleteSpamMsg", //Message
  "POST /api/filterSpammedMsgBySearch": "MessageController.filterSpammedMsgBySearch", //Message
  "POST /api/filterSpammedMsgByDate": "MessageController.filterSpammedMsgByDate", //Message

  // For settings Controller..
  //ADMIN PANEL APIS
  "GET /api/getSettings": "SettingsController.getSettings",
  "POST /api/updateSystemSettings": "SettingsController.updateSystemSettings",
  "GET /api/addSettings": "SettingsController.addSettings",

  // For Admin Controller..
  "POST /api/createAdmin": "AdminController.createAdmin",
  "POST /api/verifyAdmin": "AdminController.verifyAdmin", //Login Admin
  "POST /api/updateAdmin": "AdminController.updateAdmin",
  "POST /api/deleteAdmin": "AdminController.deleteAdmin",
  "POST /api/getAllAdmin": "AdminController.getAllAdmin",
  "POST /api/resetPassword": "AdminController.resetPassword",
  "POST /api/verifyEmail": "AdminController.verifyEmail",
  "POST /api/sendEmail": "AdminController.sendEmail",
  "POST /api/verifyToken": "AdminController.verifyToken",
  "POST /api/getSuperAdmin": "AdminController.getSuperAdmin",
  "POST /api/reset-password-token": "AdminController.getResetPasswordCode",

  /***************************************************************************
   *                                                                          *
   * More custom routes here...                                               *
   * (See https://sailsjs.com/config/routes for examples.)                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the routes in this file, it   *
   * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
   * not match any of those, it is matched against static assets.             *
   *                                                                          *
   ***************************************************************************/
};
