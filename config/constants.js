const ResponseCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
};

// userRelated statuscode start with 2001..2002
const UserResponseCodes = {
  USER_SUCCESS: 2001,
  USER_NOT_FOUND: 2002,
  USER_PASSWORD_KEY_ERROR: 2003,
  USER_ALREADY_EXIST: 2004,
  USER_REPORTED: 2005,
  USER_BANNED: 2006,
  USER_SUSPEND: 2007,
  USER_PASSWORD_MATCH_ERROR: 2008,
  USER_FETCH_FAILED: 2009,
  USER_DELETED_ERROR: 2010,
  PASSWORD_SHOULD_NOT_SAME: 2011,
};

const MessageResponseCodes = {
  MESSAGE_SUCCESS: 3001,
  MESSAGE_NOT_FOUND: 3002,
  MESSAGE_REPORTED: 3003,
  MESSAGE_FETCH_FAILED: 3004,
  MESSAGE_DELETED_FAILED: 3005,
};

const ChatResponseCodes = {
  CHAT_SUCCESS: 4001,
  CHAT_NOT_FOUND: 4002,
  CHAT_FETCH_FAILED: 4003,
  CHAT_DELETED_FAILED: 4004,
};

const UserSettingResponseCodes = {
  SETTING_SUCCESS: 5001,
  SETTING_NOT_FOUND: 5002,
  SETTING_FETCH_FAILED: 5003,
  SETTING_UPDATE_FAILED: 5004,
};

const GroupProfile = {
  imageURL: "https://chat.razgovor.fyi:1336/",
};

const AutoDeleteOptions = {
  Weekly: {
    name: "Week",
    cron: "0 0 */7 * *",
  },
  Fortnight: {
    name: "Fortnight",
    cron: "0 0 */15 * *",
  },
  Monthly: {
    name: "Month",
    cron: "0 0 * */1 *",
  },
};
const AutoDeleteDefaultTime = `0 0 */7 * *`;

module.exports.constants = {
  ResponseCodes,
  GroupProfile,
  UserResponseCodes,
  MessageResponseCodes,
  ChatResponseCodes,
  AutoDeleteOptions,
  UserSettingResponseCodes,
  AutoDeleteDefaultTime,
};
