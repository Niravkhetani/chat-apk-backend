/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {
  /***************************************************************************
   *                                                                          *
   * Default policy for all controllers and actions, unless overridden.       *
   * (`true` allows public access)                                            *
   *                                                                          *
   ***************************************************************************/

  // '*': true,
  UsersController: {
    "*": true,
    updateUser: "authenticated",
    getAvailableUsers: "authenticated",
    uploadProfileimage: "authenticated",
    userPrivacy: "authenticated",
    blockContacts: "authenticated",
    unblockContacts: "authenticated",
    getBlockedContacts: "authenticated",
    deleteUser: "authenticated",
    getUsers: "authenticated",
    filterUserByName: "authenticated",
    accountVerification: "authenticated",

    getUserAndMessageCount: "authenticated",
    getCurrentUsers: "authenticated",
    getUsersYearWise: "authenticated",
    filterUserBySearch: "authenticated",
    filterReportedUsersBySearch: "authenticated",
    filterReportedMsgBySearch: "authenticated",
    filterReportedUsersByDate: "authenticated",
    filterUsersByDate: "authenticated",
    getUserById: "authenticated",
    postBanUser: "authenticated",
    postSuspendUser: "authenticated",
    postDeleteUser: "authenticated",
    postActivateUser: "authenticated",
    postDeactivateUser: "authenticated",
    postRemoveReportFlag: "authenticated",
    editUser: "authenticated",
  },

  RoomController: {
    "*": true,
    // isTyping: "authenticated",
    // isOnline: "authenticated",
  },

  ChatController: {
    "*": true,
    createChat: "authenticated",
    getChat: "authenticated",
    leaveFromGroup: "authenticated",
    addUserToGroup: "authenticated",
    removeUserFromGroup: "authenticated",
    addAdminToGroup: "authenticated",
    removeAdminFromGroup: "authenticated",
    updateGroupInfo: "authenticated",
    getAllGroups: "authenticated",
    getGroupsYearWise: "authenticated",
    getChatsById: "authenticated",
    getChatV2: "authenticated",
    getChatsByIdV2: "authenticated",
    getUserChat: "authenticated",
    getGroupChat: "authenticated",
  },

  MessageController: {
    "*": true,
    // messageSeen: "authenticated",
    deleteMessageForEveryone: "authenticated",
    postSpamMsg: "authenticated",
    getTotalMsgs: "authenticated",
    getAllSpammedMsgs: "authenticated",
    postRemoveSpamFlag: "authenticated",
    deleteSpamMsg: "authenticated",
    filterSpammedMsgBySearch: "authenticated",
    filterSpammedMsgByDate: "authenticated",
    clearGroupChat: "authenticated",
    reportMessage: "authenticated",
    deleteChat: "authenticated",
  },

  SettingsController: {
    "*": true,
    getSettings: "authenticated",
    updateSystemSettings: "authenticated",
    addSettings: "authenticated",
  },

  AdminController: {
    "*": true,
    // createAdmin: "authenticated",
    updateAdmin: "authenticated",
    deleteAdmin: "authenticated",
    getAllAdmin: "authenticated",
    verifyToken: "authenticated",
    sendEmail: "authenticated",
    resetPassword: "authenticated",
    getSuperAdmin: "authenticated",
    registerUser: "authenticated",
  },
  UserSettingController: {
    "*": true,
    updateUserSettings: "authenticated",
    updateUserDeleteSettingsFlag: "authenticated",
    fetchUserSettings: "authenticated",
  },
};
