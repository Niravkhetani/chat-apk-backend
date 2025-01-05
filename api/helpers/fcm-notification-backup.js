let FCM = require("fcm-node");
let serverKey = "AAAAJRKFQ28:APA91bEiyLXvgJt_CqQsEZC5zymM_ciAUTmKm_6LRALnuzPj0bRb6jxQ5oqnWBZA3Pq97jlRB9SyE1Y-STd4v6yD11-pLCvSUdrl5bl92jyz6oZiKBYU03uCwVd5v7LwpcQ8y8xu8LrD"
let fcm = new FCM(serverKey);
let _ = require("lodash");
// const deviceToken =
//   "dvCR6bz7QKCy0wpd-WAYLZ:APA91bFTCiYLSsRdZ2ROGZnq7dgiSmn9lafK-XSCUvZOuLgbCTw9GvTUQuh5GzseF5SxKLzuMNBP-0-fEGnAmf9MpnHXd5m2pmNkVk6-Oj2oX5_aZAekYqbTL3YxiEcBT5_MwLLDIJm3";
module.exports = {
  friendlyName: "Send FCM notification",

  description:
    "Sending firebase cloud messaging to the user when application is in background",

  // extendedDescription: 'Use `activeSince` to only retrieve users who logged in since a certain date/time.',

  inputs: {
    // receivers-room
    userids: {
      friendlyName: "users ids",
      description: "users ids to whome to send notifications",
      type: "json",
    },
    // messageText
    message: {
      friendlyName: "notificaion message",
      description: "Actual message sends to the user",
      type: "json",
    },
    // chatId
    chatId: {
      friendlyName: "chat id",
      description: "message is sended to the given chat id",
      type: "string",
    },
    // messageType
    messageType: {
      friendlyName: "type of the message",
      description:
        "describes which type of the message is send as notification to the user",
      type: "string",
    },
    isGroup: {
      friendlyName: "identify group or not",
      description: "describes which if this message is for a group or not",
      type: "boolean",
    },
  },

  exits: {
    success: {
      outputDescription: "Notification sended to the destination user",
    },

    noNotificationSended: {
      description: "Notification is not sended",
    },
  },

  fn: async function (inputs, exits) {
    const fcmUser = await Users.find({ id: inputs.userids });
    inputs.message.messageMedia = "";

    for (let i = 0; i < fcmUser.length; i++) {
      if (fcmUser[i].deviceToken) {
        console.log("====>>>inputs", inputs)        
        let pushMessage = {
          to: fcmUser[i].deviceToken,
          // collapse_key: "close",
          notification: {
            type: inputs.messageType,
            message: inputs.message,
            // chatId: inputs.chatId,
            data: inputs.message || inputs.messageType,
            title: "New message from Razgovor",
            //body: inputs.message.messageText,
	          body: "You have received a new message",
            // replyData: JSON.stringify({
            //   dstId: _.without(
            //     inputs.message.chatId.participatesArray,
            //     fcmUser[i].id
            //   ),
            //   chatId: inputs.message.chatId.id,
            //   msgId: inputs.message.id,
            // }),
            isGroup: inputs.isGroup,
          },
          priority: "high",
          // contentAvailable: true,
        };
        fcm.send(pushMessage, function (err, response) {
          if (err) {
            console.log("error in fcm helper ", err);
            return exits.success(err);
          } else {
            console.log("Message send successfully ", response);
            return exits.success();
          }
        });
      } else {
        console.log("No device token found!");
        return exits.success("No device token found!");
      }
    }
  },
};
