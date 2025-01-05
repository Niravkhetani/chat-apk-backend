let FCM = require("fcm-node");
let serverKey =
  "AAAAMEuQWzE:APA91bGiemNT6u_8vuWTYvohTjZooUFippSUW3_9ENSv20B-NIYvM4qmUbTjOxxfTkTSlij4ig1PhZkSMwjPNHdD_n_SNUw4qTG3OX7dTYRE9fkWfX1l19X64GLRmT9ppkVUs32NtccR";

let fcm = new FCM(serverKey);
let _ = require("lodash");

module.exports = {
  friendlyName: "Send FCM notification",

  description: "Sending firebase cloud messaging to the user when application is in background",

  // extendedDescription: 'Use `activeSince` to only retrieve users who logged in since a certain date/time.',

  inputs: {
    // receivers-room
    userids: {
      friendlyName: "users ids",
      description: "users ids to whome to send notifications",
      type: "json",
    },
    // NotificationText
    message: {
      friendlyName: "notificaion message",
      description: "Actual message sends to the user",
      type: "json",
    },
    messageText: {
      friendlyName: "message text",
      description: "Message that user sent",
      type: "string",
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
      description: "describes which type of the message is send as notification to the user",
      type: "string",
    },
    isGroup: {
      friendlyName: "identify group or not",
      description: "describes which if this message is for a group or not",
      type: "boolean",
    },
    senderName: {
      friendlyName: "name of sender",
      description: "Who send this message so when receive notification display name",
      type: "string",
    }
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
    for (let i = 0; i < inputs.userids.length; i++) {
      inputs.message.messageMedia = "";
      const fcmUser = await Users.find({ id: inputs.userids[i] });
      // console.log("@@@@@@@@@@@@@@ fcmfcmfcm user ", fcmUser);
      if (fcmUser?.length && fcmUser[0].deviceToken) {
        let pushMessage = {
          to: fcmUser[0].deviceToken,
          notification: {
            title: `New message from ${inputs.senderName}`,
            body: 'You have received a new message',
            data: inputs.message,
            badge: 1,
            icon: 'ic_launcher',
            // sound: fcmUser[i].notificationSound === true ? "default" : 'disable'
          },
          data: inputs.message, // DEBUG: Should it be JSON stringified?
          android: {
            // ANDROID
            notification: {
              icon: "ic_launcher",
              // sound: fcmUser[i].notificationSound === true ? "default" : 'disable',
              notification_priority: "high", // DEBUG
              notification_count: 1,
              content_available: true,
            },
            // priority: priority === 1 ? 'high' : 'normal', // DEBUG
          },
          apns: {
            // IOS
            headers: {
              "apns-priority": "10",
            },
            payload: {
              aps: {
                alert: {
                  title: `New message from ${inputs.senderName}`,
                  body: "You have received a new message",
                  data: "You have received a new message",
                  badge: 1,
                },
                badge: 1,
              },
            },
          },
          // senderId: "693690286309"
        }
        if(fcmUser[0].notificationSound === true){ pushMessage.notification['sound'] = 'default';
          pushMessage.android.notification['sound'] = 'default';
        }
        // console.log('NOTIFICATION', JSON.stringify(pushMessage, null, 2))
        
        // let fcm = inputs.platForm !== 'android' ? fcmAndroid : fcmiOS;
        fcm.send(pushMessage, function (err, response) {
          if (err) {
            console.log("error in fcm helper ", err);
            return exits.success(err);
          } else {
            console.log("Message send successfully ", response);
            return exits.success();
          }
        });
        // console.log("fcm", fcm);
      } else {
        console.log("No device token found!");
        return exits.success("No device token found!");
      }
    }
  },
};
