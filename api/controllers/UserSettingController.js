const {ObjectId} = require("bson");
const {settingUpdateValidation, settingDeleteValidation} = require("../validations/UserSetting");
var cronParser = require("cron-parser");
const {nativeMongoQuery} = require("./ChatController");
const {fetchCronSchedule} = require("../helpers/common");
// const UserSetting = require("../models/UserSetting");

/**
 * UserSettingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const AutoDeleteOptions = sails.config.constants.AutoDeleteOptions;
const UserSettingResponseCodes = sails.config.constants.UserSettingResponseCodes;
const AutoDeleteDefaultTime = sails.config.constants.AutoDeleteDefaultTime;
const ResponseCodes = sails.config.constants.ResponseCodes;

module.exports = {
  fetchUserSettings: async (req, res) => {
    let response = {data: {}};
    try {
      let fetchUserSettings = await UserSetting.findOne({user: req.user.userId});
      if (!fetchUserSettings) {
        const deleteCron = AutoDeleteDefaultTime;
        // Add Entry into UserSettings
        let options = {
          // currentDate: '2016-03-27 00:00:01',
          currentDate: new Date(),
          tz: "UTC",
        };
        console.log("parser ", cronParser.parseExpression(deleteCron, options));
        let next_run_at = cronParser.parseExpression(deleteCron, options).next()._date.ts;
        userSettings = await UserSetting.create({
          user: req.user.userId,
          deletedSchedule: deleteCron,
          nextRunAt: next_run_at,
          prevRunAt: 0,
          isDeleteScheduleActive: false,
        })
          .fetch()
          .catch((error) => {
            response.success = false;
            response.message = "Getting an error while fetching user settings";
            response.code = UserSettingResponseCodes.SETTING_FETCH_FAILED;
            response.data = {};
            console.log("Failed to create user setting: ", error);
          });
      }
      if (fetchUserSettings.deletedSchedule) {
      }
      fetchUserSettings.deleteMessagesDay = fetchUserSettings.isDeleteScheduleActive
        ? fetchCronSchedule(fetchUserSettings.deletedSchedule)
        : 0;
      if (!response.success) {
        response.data = fetchUserSettings;
        response.message = "User settings fetch successfully";
        response.code = UserSettingResponseCodes.SETTING_SUCCESS;
        response.success = true;
      }
    } catch (err) {
      response.success = false;
      response.message = "Getting an error while fetching user settings";
      response.code = UserSettingResponseCodes.SETTING_FETCH_FAILED;
      response.data = {};
      console.log("Failed to fetching user setting: ", err);
    }
    return res.status(ResponseCodes.OK).send(response);
  },
  updateUserSettings: async (req, res) => {
    return settingUpdateValidation(req.body, res).then(async (data) => {
      let response = {data: {}};
      try {
        let isDeleteScheduleActive = true;
        let deleteInterval = req.body.deleteInterval;
        if (req.body.deleteInterval === 0) {
          isDeleteScheduleActive = false;
          deleteInterval = 7;
        }
        const deleteCron = `0 0 */${deleteInterval} * *`;
        // const deleteCron = `*/30 * * * *`;
        // Add Entry into UserSettings
        let options = {
          // currentDate: '2016-03-27 00:00:01',
          currentDate: new Date(),
          tz: "UTC",
        };
        let next_run_at = cronParser.parseExpression(deleteCron, options).next()._date.ts;
        //   let user = await Users.findOne({id: user.id});
        UserSetting.findOne({user: req.user.userId}).then(async (record) => {
          let updatedSetting = {};
          if (record) {
            updatedSetting = await UserSetting.updateOne({user: req.user.userId}).set({
              // user: new ObjectId("65b20da40bf45351dfa69f39"),
              deletedSchedule: deleteCron,
              nextRunAt: next_run_at,
              prevRunAt: 0,
              isDeleteScheduleActive: isDeleteScheduleActive,
            });
          } else {
            updatedSetting = UserSetting.create({
              user: req.user.userId,
              deletedSchedule: deleteCron,
              nextRunAt: next_run_at,
              prevRunAt: 0,
              isDeleteScheduleActive: isDeleteScheduleActive,
            })
              .then((data) => {
                console.log(data);
              })
              .catch((err) => {
                console.log("error", err);
              });
          }
          await Users.updateOne({id: req.user.userId}).set({userSetting: updatedSetting.id});
          response.success = true;
          response.message = "User settings updated successfully";
          response.data = updatedSetting;
          response.code = UserSettingResponseCodes.SETTING_SUCCESS;
          return res.status(ResponseCodes.OK).json(response);
        });
      } catch (err) {
        console.log("Error updating user settings", err);
        response.success = false;
        response.message = "User settings update failed";
        response.data = {};
        response.code = UserSettingResponseCodes.SETTING_UPDATE_FAILED;
        return res.status(ResponseCodes.OK).json(response);
      }
    });
  },
  updateUserDefaultSettings: async (req, res) => {
    return settingUpdateValidation(req.body, res).then(async (data) => {
      let response = {data: {}};
      try {
        let isDeleteScheduleActive = true;
        let deleteInterval = req.body.deleteInterval;
        if (req.body.deleteInterval === 0) {
          isDeleteScheduleActive = false;
          deleteInterval = 7;
        }
        const deleteCron = `0 0 */${deleteInterval} * *`;
        // Add Entry into UserSettings
        let options = {
          // currentDate: '2016-03-27 00:00:01',
          currentDate: new Date(),
          tz: "UTC",
        };
        let next_run_at = cronParser.parseExpression(deleteCron, options).next()._date.ts;
        //   let user = await Users.findOne({id: user.id});
        nativeMongoQuery(Users, 1)
          .find({userSetting: {$exists: false}})
          .then(async (userList) => {
            console.log("userList: " + userList.length);
            userList.map((user) => {
              UserSetting.findOne({user: user.id}).then(async (record) => {
                let updatedSetting = {};
                if (record) {
                  updatedSetting = await UserSetting.updateOne({user: user.id}).set({
                    // user: new ObjectId("65b20da40bf45351dfa69f39"),
                    deletedSchedule: deleteCron,
                    nextRunAt: next_run_at,
                    prevRunAt: 0,
                    isDeleteScheduleActive: isDeleteScheduleActive,
                  });
                } else {
                  updatedSetting = UserSetting.create({
                    user: user.id,
                    deletedSchedule: deleteCron,
                    nextRunAt: next_run_at,
                    prevRunAt: 0,
                    isDeleteScheduleActive: isDeleteScheduleActive,
                  })
                    .then((data) => {
                      console.log(data);
                    })
                    .catch((err) => {
                      console.log("error", err);
                    });
                }
                await Users.updateOne({id: user.id}).set({userSetting: updatedSetting.id});
              });
            });
            response.message = "User settings updated successfully";
            response.success = true;
            response.data = {};
            response.code = UserSettingResponseCodes.SETTING_SUCCESS;
            return res.status(ResponseCodes.OK).json(response);
          });
      } catch (err) {
        console.log("Error updating user settings", err);
        response.success = false;
        response.message = "User settings update failed";
        response.data = {};
        response.code = UserSettingResponseCodes.SETTING_UPDATE_FAILED;
        return res.status(ResponseCodes.OK).json(response);
      }
    });
  },
  updateUserDeleteSettingsFlag: async (req, res) => {
    return settingDeleteValidation(req.body, res).then(async (data) => {
      let response = {};
      try {
        UserSetting.findOne({user: req.user.userId}).then(async (record) => {
          let updatedSetting = {};
          if (record) {
            updatedSetting = await UserSetting.updateOne({user: req.user.userId}).set({
              deleteFromApp: req.body.deleteFromApp,
            });
          } else {
            const deleteCron = AutoDeleteDefaultTime;
            let response = {data: {}};
            // Add Entry into UserSettings
            let options = {
              // currentDate: '2016-03-27 00:00:01',
              currentDate: new Date(),
              tz: "UTC",
            };
            let next_run_at = cronParser.parseExpression(deleteCron, options).next()._date.ts;
            updatedSetting = UserSetting.create({
              user: req.user.userId,
              deletedSchedule: deleteCron,
              nextRunAt: next_run_at,
              prevRunAt: 0,
            })
              .then((data) => {
                console.log(data);
              })
              .catch((err) => {
                console.log("error", err);
              });
          }
          await Users.updateOne({id: req.user.userId}).set({userSetting: updatedSetting.id});
          response.success = true;
          response.message = "User settings updated successfully";
          response.data = updatedSetting;
          response.code = UserSettingResponseCodes.SETTING_SUCCESS;
          return res.status(ResponseCodes.OK).json(response);
        });
      } catch (err) {
        console.log("Error updating user settings", err);
        response.success = false;
        response.message = "User settings update failed";
        response.data = {};
        response.code = UserSettingResponseCodes.SETTING_UPDATE_FAILED;
        return res.status(ResponseCodes.OK).json(response);
      }
    });
  },
};
