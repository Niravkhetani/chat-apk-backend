/**
 * UsersController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const axios = require("axios");
const UserValidation = require("../validations/User");
const fileUploader = require("../services/file-uploader");
const bcrypt = require("bcrypt");
const {userNameGenerator, generatePassword, escapeRegex} = require("../helpers/common");
const {generate} = require("randomstring");
const {ResetPasswordDefault} = require("../constants/UserConstant");
const {nativeMongoQuery} = require("./ChatController");
var {ObjectId} = require("bson");
var cronParser = require("cron-parser");

// var fs = require('fs');

const Status = sails.config.constants.ResponseCodes;
const UserResponseCodes = sails.config.constants.UserResponseCodes;
const AutoDeleteDefaultTime = sails.config.constants.AutoDeleteDefaultTime;

module.exports = {
  /*
  This api is used for login user.
  */
  loginUser: async (req, res) => {
    return UserValidation.loginValidation(req.body, res).then(async (data) => {
      let user = await Users.findOne({
        userName: req.body.userName,
      });
      let response = {data: {}};

      // console.log("Find user for login ", user);
      if (user && user.isBanned) {
        response.code = UserResponseCodes.USER_BANNED;
        response.message = "Your account has been banned.";
        response.data.data = {};
        response.success = false;
        return res.status(Status.OK).json(response);
      }
      if (user && user.suspendMeta && user.suspendMeta.isSuspended) {
        response.code = UserResponseCodes.USER_SUSPEND;
        response.message = "Your account has been suspended.";
        response.success = false;
        response.data = {};
        return res.status(Status.BAD_REQUEST).json(response);
      }
      if (!user) {
        response.code = UserResponseCodes.USER_NOT_FOUND;
        response.message = "User not found";
        response.data = {};
        response.success = false;
        return res.status(Status.OK).json(response);
      }
      let isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isPasswordMatch) {
        response.code = UserResponseCodes.USER_PASSWORD_MATCH_ERROR;
        response.message = "Invalid userName or password";
        response.data = {};
        response.success = false;
        return res.status(Status.OK).json(response);
      }
      let token = await sails.services.tokenauth.generateToken({
        userName: user.userName,
      });
      console.log("value of token", token);

      // after verification token will be set to the users model and isVerified flag will true..
      var updateUser = await Users.updateOne({id: user.id})
        .set({
          isVerified: true,
          token: token,
          isDeleted: false,
          deactivated: false,
        })
        .catch((error) => {
          response.status = Status.BAD_REQUEST;
          response.error = error;
          return res.status(Status.BAD_REQUEST).json(response);
        });
      // console.log("upDATED USER IS ", updateUser);

      response.code = UserResponseCodes.USER_SUCCESS;
      response.message = "User Login successfully!";
      response.data = {...updateUser, signUp: updateUser.resetPassword === ResetPasswordDefault};
      response.success = true;
      // console.log("data", response);
      return res.status(Status.OK).json(response);
    });
  },
  registerUser: async (req, res) => {
    return UserValidation.signupValidation(req.body).then(async (data) => {
      let response = {message: "", success: false};
      let status = Status.OK;
      let user = await Users.findOne({
        userName: req.body.userName,
      });
      if (user) {
        response.code = UserResponseCodes.USER_ALREADY_EXIST;
        response.message = "User found with same username Please Use different Username";
        response.data = {};
        response.success = false;
        return res.status(status).json(response);
      }
      let token = await sails.services.tokenauth.generateToken({
        userName: req.body.userName,
      });
      const encryptedPassword = generatePassword(req.body.password);
      const deleteCron = AutoDeleteDefaultTime;
      // Add Entry into UserSettings
      let options = {
        // currentDate: '2016-03-27 00:00:01',
        currentDate: new Date(),
        tz: "UTC",
      };
      let next_run_at = cronParser.parseExpression(deleteCron, options).next()._date.ts;
      const userResponse = await Users.create({
        userName: req.body.userName,
        token: token,
        isDeleted: false,
        deactivated: false,
        isVerified: true,
        password: encryptedPassword,
        fullName: req.body.fullName,
      })
        .fetch()
        .catch((error) => {
          response.status = Status.BAD_REQUEST;
          response.error = error;
          return res.status(Status.BAD_REQUEST).json(response);
        });
      const userSettings = await UserSetting.create({
        user: userResponse.id,
        deletedSchedule: deleteCron,
        nextRunAt: next_run_at,
        prevRunAt: 0,
        isDeleteScheduleActive: false,
      })
        .fetch()
        .catch((error) => {
          console.log("Failed to create user setting: ", error);
        });
      await Users.updateOne({id: userResponse.id}).set({userSetting: userSettings.id});
      response.message = "User register successfully!";
      response.success = true;
      response.code = UserResponseCodes.USER_SUCCESS;
      response.data = {userResponse};
      return res.status(status).json(response);
    });
  },

  resetPassword: async (req, res) => {
    let response = {};
    const validation = req.body.changePassword
      ? UserValidation.changePasswordValidation
      : UserValidation.resetPasswordValidation;
    return validation(req.body)
      .then(async (data) => {
        let user = await Users.findOne({
          userName: req.body.userName,
        });
        if (!user) {
          response.success = false;
          response.message = "User not found";
          response.code = UserResponseCodes.USER_NOT_FOUND;
          return res.status(Status.OK).json(response);
        }
        /* NOTE: To check API called for reset Password by admin or User if reset password key is present then it will
		   		   generated by admin and not than initiated by user */
        if (req.body.resetPasswordKey !== user.resetPassword && !req.body.existingPassword) {
          response.success = false;
          response.message = "resetPassword Key is not valid";
          response.code = UserResponseCodes.USER_PASSWORD_KEY_ERROR;
          return res.status(Status.FORBIDDEN).json(response);
        }
        /* NOTE: existing password and entered password should not same */
        if (req.body.existingPassword && req.body.existingPassword === req.body.password) {
          response.code = UserResponseCodes.PASSWORD_SHOULD_NOT_SAME;
          response.message = "existing password should not be same as changed password";
          response.data = {};
          response.success = false;
          return res.status(Status.OK).json(response);
        }
        if (req.body.existingPassword) {
          let isPasswordMatch = await bcrypt.compare(req.body.existingPassword, user.password);
          if (!isPasswordMatch) {
            response.code = UserResponseCodes.USER_PASSWORD_MATCH_ERROR;
            response.message = "Password not match with existing";
            response.data = {};
            response.success = false;
            return res.status(Status.OK).json(response);
          }
        }

        //Note: To Check request send for pin verification or change password
        if (req.body.pinVerification) {
          response.status = Status.OK;
          response.message = "User Pin Verified";
          response.data = {};
          response.code = UserResponseCodes.USER_SUCCESS;
          return res.status(response.status).json(response);
        }
        let token = await sails.services.tokenauth.generateToken({
          userName: req.body.userName,
        });
        const encryptedPassword = generatePassword(req.body.password);
        const updatedUser = Users.updateOne({id: user.id})
          .set({
            password: encryptedPassword,
            token: token,
            isDeleted: false,
            resetPassword: "",
          })
          .catch((error) => {
            response.status = Status.BAD_REQUEST;
            response.message = "Unable to process";
            response.error = error;
            return res.status(Status.BAD_REQUEST).json(response);
          });

        response.status = Status.OK;
        response.message = "password changed successfully!";
        response.data = updatedUser;
        response.code = UserResponseCodes.USER_SUCCESS;
        return res.status(response.status).json(response);
      })
      .catch((error) => {
        console.log("Errro in reset password ", error);
        response.code = Status.BAD_REQUEST;
        response.message = `${error.message} is required`;
        return res.status(Status.OK).json(response);
      });
  },

  validateUserName: async (req, res) => {
    return UserValidation.getUserNamePasswordValidation(req.params).then(async () => {
      let user = await nativeMongoQuery(Users, 1).find({
        userName: req.params.userName,
        resetPassword: {$nin: ["", ResetPasswordDefault]},
      });
      let response = {};
      let status = Status.OK;
      console.log("user", user);
      if (!user.length) {
        response.code = UserResponseCodes.USER_NOT_FOUND;
        response.data = {};
        status = Status.OK;
        response.success = false;
        response.message = "Please Verify UserName";
      } else {
        response.code = UserResponseCodes.USER_SUCCESS;
        status = Status.OK;
        response.data = {};
        response.success = true;
        response.message = "User Verified successfully";
      }
      return res.status(status).json(response);
    });
  },

  getUserName: async (req, res) => {
    return UserValidation.getUserNamePasswordValidation(req.body).then(async () => {
      let response = {data: {}, success: true, message: ""};
      let status = Status.OK;
      let userName = "";
      if (req.body.userName) {
        userName = await Users.findOne({userName: req.body.userName});
      }
      if (userName) {
        response.code = UserResponseCodes.USER_ALREADY_EXIST;
        status = Status.OK;
        response.success = false;
        response.message = "Username already in use";
      } else {
        response.code = UserResponseCodes.USER_SUCCESS;
      }
      let validUserFound = "";
      let userNameNumber = 3;
      var userNameList = userNameGenerator(`${req.body.fullName}`, 10, userNameNumber);
      const generateUsername = async () => {
        for (let i = 0; i < userNameList.length; i += 1) {
          let foundDuplicateUserName = await Users.findOne({userName: userNameList[i]});
          if (!foundDuplicateUserName) {
            validUserFound = userNameList[i];
            break;
          } else {
            if (i === userNameList.length - 1) {
              userNameList = userNameGenerator(`${req.body.fullName}`, 10, userNameNumber + 1);
              generateUsername();
            }
          }
        }
      };

      Promise.all([generateUsername()]).then(() => {
        response.data.userName = validUserFound;
        return res.status(status).json(response);
      });
    });
  },

  getUsers: async (req, res) => {
    return UserValidation.getUserList(req.query || {}).then(async (data) => {
      let response = {};

      let {limit = 25, page = 1} = req.query || {};
      if (limit > 25) {
        limit = 25;
      }
      if (page <= 0) {
        page = 1;
      }
      page = page - 1;
      const getUsers = await Users.find({
        isBanned: false,
        isReported: false,
        isVerified: true,
        deactivated: false,
        isDeleted: false,
        userName: {"!=": [req.user.user.userName]},
      })
        .limit(limit)
        .skip(limit * page);
      const getCount = await Users.count({
        isBanned: false,
        isReported: false,
        isVerified: true,
        deactivated: false,
        isDeleted: false,
        userName: {"!=": [req.user.user.userName]},
      }).catch((err) => {
        response.status = Status.BAD_REQUEST;
        response.error = error;
        return res.status(Status.BAD_REQUEST).json(response);
      });
      if (!getUsers) {
        response.code = UserResponseCodes.USER_FETCH_FAILED;
        response.data = {};
        response.message = "User Fetch Failed";
        response.success = false;
        return res
          .status(Status.OK)
          .send(response)
          .catch((err) => {
            response.status = Status.BAD_REQUEST;
            response.error = error;
            return res.status(Status.BAD_REQUEST).json(response);
          });
      }
      response.data = {Users: getUsers, count: getCount};
      response.code = UserResponseCodes.USER_SUCCESS;
      response.message = "User fetch succeed";
      response.success = true;
      return res.status(Status.OK).send(response);
    });
  },

  filterUserByName: async (req, res) => {
    console.log("Request of params ", req.params);
    return UserValidation.getUserByName(req.params || {}).then(async (data) => {
      let response = {};
      //create a fuzzy search
      const getUsers = await nativeMongoQuery(Users, 1).find({
        isBanned: false,
        isReported: false,
        isVerified: true,
        deactivated: false,
        isDeleted: false,
        userName: req.params.userName,
      });
      if (!getUsers.length) {
        response.code = UserResponseCodes.USER_FETCH_FAILED;
        response.data = {};
        response.message = "UserList Fetch Failed";
        response.success = false;
        return res.status(Status.OK).send(response);
      }
      response.data = {Users: getUsers};
      response.code = UserResponseCodes.USER_SUCCESS;
      response.message = "User fetch succeed";
      response.success = true;
      return res.status(Status.OK).send(response);
    });
  },
  /*
  in this API first it will check request validation and then,  user have to verified and 
  it will check through token assign to the user. and then update the user properties accordingly..
   */
  updateUser: async (req, res) => {
    let response = {};
    let imagePath = "";
    // const files = req._fileparser.upstreams.length ? req.file('file') : undefined;
    console.log("req.body in update User ", req.body);
    return UserValidation.updateUserValidation(req.body).then(async (data) => {
      const {fullName, deviceToken, info, notificationSound} = data;
      let userDetails = {
        fullName,
        deviceToken,
        notificationSound,
      };
      if (req.body.profilePic) {
        userDetails.profilePic = req.body.profilePic;
      }
      if (req.body.contacts) {
        userDetails.contacts = req.body.contacts;
      }
      console.log("updateuser", userDetails);
      console.log("req.user", req.user);

      // updating the user with fullname, device token and blockedUser array..
      let updatedUser = await Users.updateOne({id: req.user.userId})
        .set(userDetails)
        .catch((error) => {
          console.log("error", error);
          response.status = Status.BAD_REQUEST;
          response.error = error;
          return res.status(Status.BAD_REQUEST).json(response);
        });

      updatedUser = await Users.findOne({id: updatedUser.id}).populate("blockedUser");

      // console.log("value of updated user", user);
      sails.sockets.blast("userUpdated", "User is updated");
      response.status = Status.OK;
      response.data = updatedUser;
      response.message = "User updated successfully";
      console.log("response.status", response.status);
      return res.status(Status.OK).json(response);
    });
  },

  uploadProfileimage: async (req, res) => {
    let response = {};
    let imagePath = "";
    console.log("body:::::", req.body);
    const files = req._fileparser.upstreams.length ? req.file("file") : undefined;
    if (files) {
      // console.log(files,"value fogshdgsjh");
      imagePath = await fileUploader
        .uploadProfile(files, req.user.userId + "/")
        .then((image) => {
          console.log("image.filename : ", image[0].filename);
          if (!image.length) {
            return undefined;
          }
          return image[0].fd.split("assets").reverse()[0];
        })
        .catch((err) => {
          console.log("error : ", err);
          response.status = Status.BAD_REQUEST;
          response.error = err;
          return res.status(Status.BAD_REQUEST).json(response);
        });

      console.log("imagePath : ", imagePath);
      response.status = Status.OK;
      response.data = imagePath;
      response.message = "User updated successfully";
      return res.status(Status.OK).json(response);
    }
  },

  /*
  it will get all the verified users.. by checking a authentication token..
  */
  getAvailableUsers: async (req, res) => {
    console.log("getting available users..............");
    let response = {};
    if (!req.body.phoneNumbers) {
      response.status = Status.BAD_REQUEST;
      response.error = "Phone numbers required";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    console.log("req.body.phoneNumber", req.body.phoneNumbers);

    // find availabe users who verified.. And isDeleted flag is false..
    let availableUsers = await Users.find({
      globalPhoneNumber: {in: req.body.phoneNumbers},
      isVerified: true,
      isDeleted: false,
    }).catch((error) => {
      response.status = Status.BAD_REQUEST;
      response.error = error;
      return res.status(Status.BAD_REQUEST).json(response);
    });
    // console.log("availableUsers : ", availableUsers);
    if (!availableUsers.length) {
      response.status = Status.BAD_REQUEST;
      response.error = "No users available";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    response.status = Status.OK;
    response.data = availableUsers;
    response.message = "Users retrived successfully";
    return res.status(Status.OK).json(response);
  },

  /*
  user will set privacy settings like lastSeen with everyone etc..
  */
  userPrivacy: async (req, res) => {
    let response = {};
    let updateUser;

    let setting = ["lastSeen", "profile", "about", "group", "isReadReceipt"];

    if (Object.keys(req.body).length > 1) {
      response.status = Status.BAD_REQUEST;
      response.message = "Internal Servar error";

      return res.status(Status.BAD_REQUEST).json(response);
    }

    let value = setting.includes(Object.keys(req.body)[0]);

    // if value is not there in the setting array then value is false and return error message
    if (!value) {
      response.status = Status.BAD_REQUEST;
      response.message = "Internal Servar error";

      return res.status(Status.BAD_REQUEST).json(response);
    } else {
      updateUser = await Users.updateOne({
        id: req.user.userId,
      }).set(req.body);

      console.log("updateUser: ", updateUser);
    }

    if (!updateUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found";

      return res.status(Status.BAD_REQUEST).json(response);
    }
    sails.sockets.blast("userUpdated", "User is updated");
    response.status = Status.OK;
    response.data = updateUser;
    response.message = "User is Updated";
    return res.status(Status.OK).json(response);
  },

  /*
  user will able to block the perticular contact if he don't want to chat further.
  And we store that user's reference to the blockedUser in Users model..
  */
  blockContacts: async (req, res) => {
    let response = {};
    if (!req.body.userId) {
      response.status = Status.BAD_REQUEST;
      response.message = "Required user id";
      return res.status(Status.OK).json(response);
    }
    // find the user that need to add into the parent blocked list..
    const blockedUser = await Users.findOne({
      id: req.body.userId,
    }).catch((err) => {
      response.status = Status.BAD_REQUEST;
      response.error = err;
      response.message = "User not found";
      return res.status(Status.BAD_REQUEST).json(response);
    });
    // console.log('Blocked user ', blockedUser);

    if (!blockedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "blocked user is not found";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    console.log("Requested user ", req.user.userId);
    console.log("blocked user ", blockedUser.id);

    // update user with blocked users
    const updatedUser = await Users.addToCollection(req.user.userId, "blockedUser")
      .members(blockedUser.id)
      .catch((err) => {
        response.status = Status.BAD_REQUEST;
        response.error = err;
        return res.status(Status.BAD_REQUEST).json(response);
      });
    // console.log("updatedUser : ", updatedUser);

    let blockedArray = [];
    console.log("blockedUsers ", req.user.user.blockedUsers);
    if (req.user.user.blockedUsers && req.user.user.blockedUsers.length) {
      blockedArray = req.user.user.blockedUsers;
    }
    blockedArray.push(req.body.userId);
    await Users.updateOne({id: req.user.userId}).set({
      blockedUsers: blockedArray,
    });

    sails.sockets.blast("userUpdated", "User is updated");
    response.status = Status.OK;
    response.message = "User blocked successfully";

    return res.status(Status.OK).json(response);
  },

  /*
  user will able to unblock the perticular contact if he  want to chat further.
  And we remove that user's reference from the blockedUser in Users model..
  */
  unblockContacts: async (req, res) => {
    let response = {};
    const parentUser = await Users.findOne({
      id: req.user.userId,
    })
      .populate("blockedUser")
      .catch((err) => {
        response.status = Status.BAD_REQUEST;
        response.error = err;
        return res.status(Status.BAD_REQUEST).json(response);
      });

    // console.log("parentUser : ", parentUser);

    if (parentUser.blockedUser.length == 0) {
      response.status = Status.BAD_REQUEST;
      response.message = "User has no blocked users";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    if (!parentUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not available";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    // find the user that need to remove from the blocked list..
    const blockedUser = await Users.findOne({
      id: req.body.userId,
    }).catch((err) => {
      response.status = Status.BAD_REQUEST;
      response.error = err;
      return res.status(Status.BAD_REQUEST).json(response);
    });
    // console.log("blockedUser : ", blockedUser);

    if (!blockedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "blocked user is not found";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    // update user with blocked users
    const updatedUser = await Users.removeFromCollection(parentUser.id, "blockedUser")
      .members(blockedUser.id)
      .catch((err) => {
        response.status = Status.BAD_REQUEST;
        response.error = err;
        return res.status(Status.BAD_REQUEST).json(response);
      });
    // console.log("updatedUser : ", updatedUser);

    let blockedArray = [];
    if (req.user.user.blockedUsers && req.user.user.blockedUsers.length) {
      blockedArray = req.user.user.blockedUsers.filter((user) => user !== req.body.userId);
    }
    await Users.updateOne({id: req.user.userId}).set({
      blockedUsers: blockedArray,
    });

    const personalChat = await nativeMongoQuery(Chat, 1).find({
      $or: [
        {
          participatesArray: {
            $eq: [req.body.userId, req.user.userId],
          },
        },
        {
          participatesArray: {
            $eq: [req.user.userId, req.body.userId],
          },
        },
      ],
      isGroup: false,
    });

    // console.log("Personal chat ", personalChat);

    sails.sockets.blast("userUpdated", "User is updated");

    response.status = Status.OK;
    response.message = "User unblocked successfully";
    response.data = personalChat;
    return res.status(Status.OK).json(response);
  },

  /*
  user will get all the available blocked users in their chat..
  and will able to see how many blocked contacts he has..
  */

  getBlockedContacts: async (req, res) => {
    let response = {};
    // console.log("user is called in listing  ", req.user);

    let availableUser = await Users.findOne({
      id: req.user.userId,
    })
      .populate("blockedUser")
      .catch((err) => {
        response.status = Status.BAD_REQUEST;
        response.error = err;

        return res.status(Status.BAD_REQUEST).json(response);
      });

    // console.log("availableUser : ", availableUser);

    if (!availableUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not available";

      return res.status(Status.BAD_REQUEST).json(response);
    }

    console.log("Length : ", availableUser.blockedUser.length);

    if (availableUser.blockedUser.length == 0) {
      response.status = Status.BAD_REQUEST;
      response.message = "No blocked users available";

      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.message = "Blocked Users";
    response.data = availableUser.blockedUser;

    return res.status(Status.OK).json(response);
  },

  /*
  we do not hard-delete a perticular user from the application...
  instead of that we just soft-delete a perticular user by updating a isDeleted flag to 'true'
  */
  deleteUser: async (req, res) => {
    console.log("@@@@@@@@@@@@ Deleting user @@@@@@@@@@@");
    let response = {};
    console.log("req.user.userId : ", req.user.userId);

    const deletedUser = await Users.updateOne({
      id: req.user.userId,
    }).set({
      deactivated: true,
      token: "",
      deviceToken: "",
      isVerified: false,
      lastSeenTime: new Date().getTime()
    });

    let index = -1, key; 
    sails.rooms.map((room, i) => {
      key = Object.keys(room).find((key) => {
        if (room[key] === deletedUser.id) {
          return true;
        }
      });
      if (key) {
        index = i;
      }
    });
    sails.rooms.splice(index, 1);
    console.log("sails room : ", sails.rooms);
    sails.sockets.blast("userOffline", deletedUser);

    if (!deletedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = deletedUser;
    response.message = "User deleted successfully";

    return res.status(Status.OK).json(response);
  },

  //Admin Panel APIs
  getUserAndMessageCount: async (req, res) => {
    let response = {};
    const activeUsers = await Users.count({}).where({isVerified: true});
    const reportedUsers = await Message.count({"reportMeta.isReported": true}).meta({
      enableExperimentalDeepTargets: true,
    });
    console.log("reportedUsers", reportedUsers);
    const totalMessages = await Message.count({});
    const spamMessages = await Message.count({}).where({isSpam: true});

    response.status = Status.OK;
    response.data = {
      activeUsers,
      reportedUsers,
      totalMessages,
      spamMessages,
    };
    response.message = "Get Users and Message count successfully.";
    return res.status(Status.OK).json(response);
  },

  getCurrentUsers: async (req, res) => {
    let response = {};
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    let model = req.body.users === "DeletedUsers" ? DeletedUsers : Users;

    let query = {};
    req.body.users && req.body.users == "AllUsers" ? (query = {}) : {};
    req.body.users && req.body.users == "SuspendedUsers" ? (query["suspendMeta.isSuspended"] = true) : null;
    // req.body.users && req.body.users == "DeletedUsers" ? (query["isDeleted"] = true) : null;
    req.body.users && req.body.users == "ReportedUsers" ? (query["isReported"] = true) : null;
    req.body.users && req.body.users == "BannedUsers" ? (query["isBanned"] = true) : null;
    const total = await model.count(query).meta({enableExperimentalDeepTargets: true});
    const users = await model
      .find(query)
      .meta({enableExperimentalDeepTargets: true})
      .sort("createdAt DESC")
      .limit(body.recordPerPage)
      .skip(body.skipRecord);
    if (!users) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = users;
    response.totalUsers = total;
    response.message = `Get all users successfully.`;
    return res.status(Status.OK).json(response);
  },

  /**
   * @param {userId} req  Which user would be delete
   * @param {} res json response
   * @returns response with status, user, message if user deleted else badStatus and message
   */
  postDeleteUser: async (req, res) => {
    let response = {};

    let deletedUserStatus;
    const deletedUser = await Users.findOne({
      id: req.body.userId,
    }).catch((err) => {
      console.log("DeletedUser create error", err);
      response.code = UserResponseCodes.USER_DELETED_ERROR;
      response.data = {};
      response.message = "Failed to delete user from database try again";
      response.success = false;
      return res.status(Status.OK).send(response);
    });
    deletedUser.isVerified = false;
    let deletedUserInsert = await DeletedUsers.create(deletedUser)
      .fetch()
      .catch((err) => {
        console.log("DeletedUser create error", err);
        if (!response.code) {
          response.code = UserResponseCodes.USER_DELETED_ERROR;
          response.data = {};
          response.message = "Failed to delete user from database try again";
          response.success = false;
          return res.status(Status.OK).send(response);
        }
      });
    // console.log("deletedUserInsert", deletedUserInsert);
    if (deletedUserInsert) {
      deletedUserStatus = await Users.destroyOne({id: req.body.userId}).catch((err) => {
        console.log("deleted User from db error", err);
        if (!response.code) {
          response.code = UserResponseCodes.USER_DELETED_ERROR;
          response.data = {};
          response.message = "Failed to delete user from database try again";
          response.success = false;
          return res.status(Status.OK).send(response);
        }
      });
    }
    if (!deletedUser || !deletedUserStatus) {
      if (!response.code) {
        response.code = UserResponseCodes.USER_DELETED_ERROR;
        response.data = {};
        response.message = "Failed to delete user from database try again";
        response.success = false;
        return res.status(Status.OK).send(response);
      }
    }
    if (!response.code) {
      response.code = UserResponseCodes.USER_SUCCESS;
      response.data = deletedUser;
      response.message = "User deleted successfully.";
      response.success = true;
      return res.status(Status.OK).json(response);
    }
  },

  /**
   * @param {userId} req Which user would be active
   * @param {} res json response
   * @returns response with status, user, message if user activated else badStatus and message
   */
  postActivateUser: async (req, res) => {
    let response = {};
    const activeUser = await Users.updateOne({
      id: req.body.userId,
    }).set({isVerified: true});

    if (!activeUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = activeUser;
    response.message = "User activated successfully";
    return res.status(Status.OK).json(response);
  },

  /**
   * @param {userId} req Which user would be deactive
   * @param {} res
   * @returns response with status, user, message if user deactivated else badStatus and message
   */
  postDeactivateUser: async (req, res) => {
    let response = {};
    const deActiveUser = await Users.updateOne({
      id: req.body.userId,
    }).set({isVerified: false});

    if (!deActiveUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = deActiveUser;
    response.message = "User deactivated successfully.";
    return res.status(Status.OK).json(response);
  },

  /**
   * @param {userId} req Which user would be deactive
   * @param {} res
   * @returns response with status, user, message if user deactivated else badStatus and message
   */
  postRemoveReportFlag: async (req, res) => {
    let response = {};
    const reportedUser = await Users.updateOne({
      id: req.body.userId,
    }).set({isReported: req.body.isReported});

    if (!reportedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = reportedUser;
    response.message = "Report flag removed successfully.";
    return res.status(Status.OK).json(response);
  },

  postBanUser: async (req, res) => {
    let response = {};
    const bannedUser = await Users.updateOne({id: req.body.userId}).set({
      isBanned: true,
    });

    if (!bannedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = bannedUser;
    response.message = "User banned successfully.";
    return res.status(Status.OK).json(response);
  },

  postSuspendUser: async (req, res) => {
    let response = {};
    const suspendedUser = await Users.updateOne({id: req.body.userId}).set({
      suspendMeta: {
        isSuspended: true,
        expires: req.body.expires,
      },
    });

    if (!suspendedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "User is not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = suspendedUser;
    response.message = "User suspended successfully.";
    return res.status(Status.OK).json(response);
  },

  getUsersYearWise: async (req, res) => {
    let response = {};
    let yearWiseUsers = await Users.getDatastore()
      .manager.collection("users")
      .aggregate([
        {
          $match: {},
        },
        {
          $group: {
            _id: {
              $year: {$toDate: "$createdAt"},
            },
            users: {$sum: 1},
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .toArray();

    // yearWiseUsers.push({_id: 2024, users: 74},{_id: 2025, users: 156}, {_id: 2026, users: 172}, {_id: 2017, users: 210})

    if (!yearWiseUsers) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    // console.log("Year wise user ", yearWiseUsers);
    response.status = Status.OK;
    response.data = yearWiseUsers;
    response.message = "Get year wise users successfully.";
    return res.status(Status.OK).json(response);
  },

  getUserById: async (userId) => {
    // console.log(" User id ", userId);
    const user = await Users.find({id: userId});

    if (!user) {
      return null;
    }
    return user[0];
  },

  editUser: async (req, res) => {
    let response = {};
    // console.log(req.body);
    const {userId, fullName, phoneNumber, info, isBanned, isReported, isSuspended, expires} = req.body;
    let userDetails = {
      fullName,
      phoneNumber,
      info,
      isBanned,
      isReported,
    };

    let updatedUser = await Users.updateOne({id: userId}).set({
      fullName,
      phoneNumber,
      info,
      isBanned,
      isReported,
      suspendMeta: {
        isSuspended: isSuspended,
        expires: expires,
      },
    });

    if (!updatedUser) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = updatedUser;
    response.message = "User updated successfully.";
    return res.status(Status.OK).json(response);
  },

  filterUserBySearch: async (req, res) => {
    let response = {};
    let body = {
      search: req.body.search,
      users: req.body.users,
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    console.log("filterUserBySearch body", body);

    let query = req.body.search ? {fullName: {contains: body.search}} : {};
    req.body.users == "AllUsers" ? (query = query) : {};
    req.body.users == "SuspendedUsers" ? (query["suspendMeta.isSuspended"] = true) : null;
    req.body.users == "DeletedUsers" ? (query["isDeleted"] = true) : null;
    req.body.users == "ReportedUsers" ? (query["isReported"] = true) : null;
    req.body.users == "BannedUsers" ? (query["isBanned"] = true) : null;
    console.log("Query of filter user ", query);

    const total = await Users.count(query);
    const users = await Users.find(query)
      .meta({enableExperimentalDeepTargets: true})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    // console.log('search ' + users)
    if (!users) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = users;
    response.message = "User filtered successfully.";
    response.totalUsers = total;
    return res.status(Status.OK).json(response);
  },

  filterReportedUsersBySearch: async (req, res) => {
    let response = {};
    let body = {
      search: req.body.search,
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    console.log("filterReportedUsersBySearch body", body);

    const total = await Users.count({isReported: true, fullName: {contains: body.search}});

    const reportedUsers = await Users.find({
      isReported: true,
      fullName: {contains: body.search},
    })
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    console.log("filtered users  " + reportedUsers);
    if (!reportedUsers) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = reportedUsers;
    response.totalUsers = total;
    response.message = "User filtered successfully.";
    return res.status(Status.OK).json(response);
  },

  filterReportedUsersByDate: async (req, res) => {
    let response = {};

    let body = {
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    const Start = new Date(body.dateFrom).getTime();
    const End = new Date(body.dateTo).getTime();
    console.log("filterReportedUsersByDate body", body);
    console.log("Date From milli ", new Date(body.dateFrom).getTime());
    console.log("Date to milli ", new Date(body.dateTo).getTime());

    const total = await Users.count({
      isReported: true,
      "reportMeta.date": {
        ">=": Start,
        "<=": End,
      },
    }).meta({enableExperimentalDeepTargets: true});

    const reportedUsers = await Users.find({})
      .where({
        isReported: true,
        "reportMeta.date": {
          ">=": Start,
          "<=": End,
        },
      })
      .meta({enableExperimentalDeepTargets: true});

    console.log("FILTER REPORTED USER  " + JSON.stringify(reportedUsers));

    if (!reportedUsers) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = reportedUsers;
    response.message = "User filtered successfully.";
    response.totalUsers = total;
    return res.status(Status.OK).json(response);
  },

  filterReportedMsgBySearch: async (req, res) => {
    let response = {};
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    console.log("filterReportedMsgBySearch body", body);

    const total = await Users.count({
      isReported: true,
      "reportMeta.message": {contains: req.body.search},
    }).meta({enableExperimentalDeepTargets: true});
    const reportedUsers = await Users.find({
      isReported: true,
      "reportMeta.message": {contains: req.body.search},
    })
      .meta({enableExperimentalDeepTargets: true})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    // console.log('search ' + users)
    if (!reportedUsers) {
      response.status = Status.BAD_REQUEST;
      response.message = "Message not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = reportedUsers;
    response.message = "Message filtered successfully.";
    response.totalUsers = total;
    return res.status(Status.OK).json(response);
  },

  filterUsersByDate: async (req, res) => {
    let response = {};
    let body = {
      users: req.body.users,
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };

    // let Start = new Date(new Date(req.body.dateFrom).toLocaleDateString("en-EN", {timeZone: "GMT"}));
    // let End = new Date(new Date(req.body.dateTo).toLocaleDateString("en-EN", {timeZone: "GMT"}));
    let Start = parseInt(req.body.dateFrom);
    let End = parseInt(req.body.dateTo);
    if (Start === End) {
      End = End + 60 * 60 * 24 * 1 * 1000;
    }

    // let query = {
    //   createdAt: 0,
    // };
    // body.users == 'AllUsers' ? query = query : {}
    // body.users == 'SuspendedUsers' ? query["suspendMeta.isSuspended"] = true : null;
    // body.users == 'DeletedUsers' ? query["isDeleted"] = true : null;
    // body.users == 'ReportedUsers' ? query["isReported"] = true : null;
    // body.users == 'BannedUsers' ? query["isBanned"] = true : null;
    // console.log("Query of filter users by date ", query);

    const total = await Users.count({
      createdAt: {
        ">=": Start,
        "<=": End,
      },
    }).meta({enableExperimentalDeepTargets: true});

    const filterdUsers = await Users.find({})
      .where({
        createdAt: {
          ">=": Start,
          "<=": End,
        },
      })
      .meta({enableExperimentalDeepTargets: true})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    // console.log('search ' + users)
    if (!filterdUsers) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = filterdUsers;
    response.message = "User filtered successfully.";
    response.totalUsers = total;
    return res.status(Status.OK).json(response);
  },

  accountVerification: async (req, res) => {
    let response = {};
    let message = {
      isBanned: {
        message: "You are banned please contact administrator",
        code: UserResponseCodes.USER_BANNED,
        success: false,
        data: {},
      },
      isReported: {
        message: "You are reported Please contact administrator",
        code: UserResponseCodes.USER_REPORTED,
        success: false,
        data: {},
      },
      isSuspended: {
        message: "You are suspended Please contact administrator",
        code: UserResponseCodes.USER_SUSPEND,
        success: false,
        data: {},
      },
    };
    let user = req.user.user;
    // console.log("🚀 ~ accountVerification: ~ user:", user);
    switch (true) {
      case user.isBanned: {
        response = message["isBanned"];
        break;
      }
      case user.isReported: {
        response = message["isReported"];
        break;
      }
      case user?.suspendMeta?.isSuspended:
        response = message["isSuspended"];
        break;
      default:
        response.message = "User fetched successfully";
        response.code = UserResponseCodes.USER_SUCCESS;
        response.data = user;
        response.success = true;
        break;
    }
    return res.status(Status.OK).send(response);
  },
};
