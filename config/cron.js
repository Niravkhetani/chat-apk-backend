const CronJob = require("cron").CronJob;
const moment = require("moment");
const {ObjectId} = require("bson");
const cronParser = require("cron-parser");

module.exports.cron = {
  connection: {
    schedule: "*/1 * * * * *", //run on every seconds
    onTick: async function () {
      // console.log("cron.js room : ", sails.rooms);

      let index = -1;
      sails.rooms.forEach(async (e, i) => {
        if (new Date().getTime() - e.updatedAt >= 5000) {
          index = i;
        }
        if (index >= 0) {
          let getUser = await Users.updateOne({
            id: Object.keys(sails.rooms[index])[0],
          }).set({
            lastSeenTime: sails.rooms[index].updatedAt,
          });

          // delete sails.rooms[index];
          // sails.rooms.splice(index, 1);

          index = -1;
        }
      });
      // console.log("index : ", obj[index]);
      // const rooms = sails.rooms.filter(
      //   (room) => new Date().getTime() - room.updatedAt < 10000
      // );
      // sails.rooms = rooms;
    },
  },

  updateSuspendedUser: {
    schedule: "0 */1 * * * *", // run every minute
    update: async function () {
      // console.log(" suspendMeta.expires " +  ('2023-04-26T14:50' > moment().format()) + " AND " + ('2023-04-26T14:50' < moment().format()));
      // get all documents that have an expiry time in the past
      const suspendedUsers = await Users.find({
        "suspendMeta.isSuspended": true,
        "suspendMeta.expires": {"<": new Date(moment().utc().toString()).getTime()},
      }).meta({enableExperimentalDeepTargets: true});

      // console.log('suspendedUsers ' + suspendedUsers);
      // console.log('suspendedUsers ' + suspendedUsers.length);

      // update each expired document
      for (const suspendedUser of suspendedUsers) {
        // console.log( 'before update '+ suspendedUser);
        await Users.updateOne({id: suspendedUser.id}).set({
          suspendMeta: {
            isSuspended: false,
            expires: 0,
          },
        });
        // console.log('updatedUser ' + JSON.stringify(updatedUser));
      }
    },
  },

  chatAutoDelete: {
    schedule: "*/1 * * * * *",
    onTick: async () => {
      const deleteMessages = await UserSetting.find({
        isDeleteScheduleActive: true,
        nextRunAt: {"<=": new Date().getTime()},
      }).populate("user");
      // console.log('Delete message user ', deleteMessages);
      deleteMessages?.map(async (deleteMessage) => {
        //remove chats or messages
        const chatArr = await Chat.find({
          participatesArray: {
            in: [deleteMessage?.user?.id],
          },
        });
        chatArr.map(async (chat) => {
          const updated_data = await Message.getDatastore()
            .manager.collection("message")
            .updateMany(
              {chatId: new ObjectId(chat.id), deletedFor: {$nin: [deleteMessage?.user?.id]}},
              {$push: {deletedFor: {$each: [deleteMessage?.user?.id]}}}
            );
          // await Chat.updateOne({ id:chat.id }, { unreadMessageCount: 0 })
        });
        //Update next_run_at time and prev_run_at time
        let options = {
          currentDate: new Date(),
          tz: "UTC",
        };
        let next_run_at = cronParser.parseExpression(deleteMessage.deletedSchedule, options).next()._date.ts;
        const updateNextTime = await UserSetting.update({id: deleteMessages.id}).set({
          nextRunAt: next_run_at,
          prevRunAt: new Date().getTime(),
          deleteFromApp: false,
        });
      });
    },
  },
};
