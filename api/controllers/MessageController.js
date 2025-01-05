/**
 * MessageController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const Status = sails.config.constants.ResponseCodes;
const fileUploader = require("../services/file-uploader");
const FCM = require("fcm-node");
const fs = require("fs");
const {deleteMessageValidation, reportMessageValidation} = require("../validations/Messages");
const {encryptMsg, decryptMsg} = require("../services/encrypt");
// const mongodb = require("mongodb");
// const {ObjectId} = require("mongodb")
// const mongodb = require("mongodb");
var {ObjectId} = require("bson");

const MessageResponseCodes = sails.config.constants.MessageResponseCodes;
const ChatResponseCodes = sails.config.constants.ChatResponseCodes;

module.exports = {
  /*
   user can send any king of data text, image
   if receiver is online then message will not stored in the database else, message stored in 
   receivers session, and when he gets online then he will receives that data from the session and
   removed from the database..
   */
  sendMessage: async (req, res) => {
    let response = {};
    let isReceived = false;
    console.log("req body : ", req.body);
    let chatUsers;
    if (req.body?.userAdded) {
      const chat = await Chat.findOne({id: req.params.chatId, isGroup: true});
      console.log("Already participantes in group ", chat);

      chatUsers = await Chat.findOne({
        id: req.params.chatId,
      }).populate("participates", {where: {id: {"!=": req.body.receiverId}}});
    } else {
      chatUsers = await Chat.findOne({
        id: req.params.chatId,
      }).populate("participates", {where: {id: {"!=": req.body.sender}}});
    }

    if (!req.body?.userAdded && req.body?.newChat) {
      chatUsers = await Chat.findOne({
        id: req.params.chatId,
      }).populate("participates");
    }

    if (!chatUsers.length && !chatUsers.participates.length) {
      response.status = Status.BAD_REQUEST;
      response.error = "No users in particular chat";
      return res.status(Status.BAD_REQUEST).json(response);
    }
    console.log("Chat Users", JSON.stringify(chatUsers));
    let receiversRoom = chatUsers.participatesArray.filter((e) => e !== req.body.sender);
    let isBlocked = false;
    let deletedFor = [];
    if (!chatUsers.isGroup) {
      let participateUser = await Users.findOne({
        id: chatUsers.participates[0].id,
      });
      console.log("Block user.... ", participateUser);

      participateUser.blockedUsers.forEach((user) => {
        if (req.body.sender === user) {
          console.log("includes works");
          isBlocked = true;
          deletedFor.push(participateUser.id);
        }
      });
    }

    const createdMessage = await Message.create({
      realmId: req.body.realmId,
      chatId: req.params.chatId,
      messageText: req.body.messageText,
      messageType: req.body.messageType,
      sender: req.body.sender,
      messageMedia: req.body.messageMedia ? req.body.messageMedia : "",
      replyOn: req.body.replyOn,
      isForwarded: req.body.isForwarded ? true : false,
      senderName: req.body.senderName,
      userName: req.body.userName,
      isGroup: chatUsers.isGroup,
      deletedFor,
      mediaEncrypted: req.body.messageMedia ? true : false,
    })
      .fetch()
      .catch((error) => {
        response.status = Status.BAD_REQUEST;
        response.error = error;
        return res.status(Status.BAD_REQUEST).json(response);
      });
    // console.log("createdMessage : ", createdMessage.sender);

    const updateChat = await Chat.updateOne({
      id: req.params.chatId,
    }).set({
      lastMessageId: req.body.realmId,
      deletedBy: [],
    });
    if (!chatUsers.isGroup) {
      chatUsers = await Chat.findOne({
        id: req.params.chatId,
      }).populate("participates", {where: {id: req.body.sender}});
    }
    delete chatUsers.createdAt;

    if (chatUsers.isGroup || (!isBlocked && !chatUsers.isGroup)) {
      await sails.sockets.broadcast(receiversRoom, "onMessage", {...createdMessage, ...chatUsers});
      if (req.body.isNotified) {
        console.log('Send notification to user....');
        // have to remove await
        await sails.helpers.fcmNotification(
          receiversRoom,
          createdMessage,
          req.body.messageText,
          req.params.chatId,
          req.body.messageType,
          updateChat.isGroup,
          req.body.senderName
        );
      }
    }

    if (isBlocked) {
      response.status = Status.OK;
      response.data = {isReceived: false, isBlocked: true};
      return res.status(Status.OK).json(response);
    }

    createdMessage.isReceived = isReceived;
    console.log("created message", createdMessage);
    response.status = Status.OK;
    response.data = createdMessage;
    response.message = "Message sent successfully";
    return res.status(Status.OK).json(response);
  },

  getSessions: (req, res) => {
    let response = {};
    response.session = sails.session;
    return res.status(200).json(response);
  },

  /*
   message seen flag will update the flag isSeen if user received message successfully, and remove perticular
   message from the database... else message will stores in receivers session. and update isReceived flag 'true'
   */
  messageSeen: async (req, res) => {
    let response = {};
    console.log("Message seen called ", req.body.userId);

    await Message.update({
      chatId: req.body.chatId,
      sender: { "!=": req.body.userId }
    })
    .set({ seenFlag: true })
    .catch((err) => {
      console.log("Error updating", err);
    });

    sails.sockets.broadcast(req.body.userId, "changedmessageflag", {
      isGroup: req.body.isGroup,
      chatId: req.body.chatId,
    });

    response.status = Status.OK;
    response.message = "Message has been seen";
    return res.status(Status.OK).json(response);
  },

  testFCM: async (req, res) => {
    console.log("ans : ", req.body.messageText);
    let user = await Users.find();
    let deviceToken =
      "dCjcLolxRc2X3bPv8zx4Sq:APA91bG-XJs42WfZJiGdOoRshz61WkvL_Sy_5p3JQQxTsh-ZNCVaa8LVj7W3eNtEpdwdnpLJq4oDX5dpxCSCzksDxWcOG8NyzMFeelhHkfAqPXWbw4onbQ041AD0mjFRHjGd3N09qosc";
    let message = {
      to: deviceToken,
      data: {
        my_key: "my value",
        isGroup: true,
      },
      priority: "high",
      // contentAvailable: true,
    };
    fcm.send(message, function (err, response) {
      if (err) {
        console.log("i am getting error", err);
      } else {
        console.log("Message send successfully ", response);
      }
    });
    //  console.log('message', message);
    return res.status(Status.OK).json(message);
  },

  deleteMessageForEveryone: async (req, res) => {
    let response = {};
    let findChat;
    console.log("Req.body.message deleteMessageForEveryone ", req.body);
    const chat = await Message.destroy({
      chatId: req.body.chatId,
      realmId: {in: req.body.messageIds},
    }).fetch();
    let chatParticipant = await Chat.find({id: req.body.chatId});
    console.log("chatParticipant", chatParticipant);
    let receiversRoom = chatParticipant[0]?.participatesArray.filter((e) => e !== req.user.userId);
    receiversRoom.map((item) => {
      console.log("🚀 ~ file: MessageController.js:294 ~ chatParticipant[0]?.participatesArray?.map ~ item:", item);
      let payload = {
        chatId: req.body.chatId,
        messageIds: req.body.messageIds,
        isGroup: chatParticipant[0].isGroup,
      };
      sails.sockets.broadcast(item, "deleteForEveryOne", payload);
    });

    console.log("chat", chat);
    // await sails.rooms.map(async (room, i) => {
    //   for (let index = 0; index < req.body.message.length; index++) {
    //     const e = req.body.message[index];
    //     findChat = await Chat.findOne({
    //       id: e.chatId,
    //     });
    //     let receiversRoom = findChat.participatesArray.filter((e) => e !== req.user.userId);
    //     await receiversRoom.forEach(async (receiver) => {
    //       if (Object.keys(room)[0] !== receiver) {
    //         let session = sails.session[receiver];
    //         if (!session) {
    //           session = [];
    //         }

    //         session.push(e);
    //         sails.session[receiver] = session;
    //       } else {
    //         let deletedMessage = await Message.destroy({
    //           realmId: e._id,
    //           // chatId: req.body.chatId,
    //         })
    //           .fetch()
    //           .catch((error) => {
    //             response.status = Status.BAD_REQUEST;
    //             response.error = error;
    //             return res.status(Status.BAD_REQUEST).json(response);
    //           });

    //         console.log("deletedMessage : ", deletedMessage);
    //       }
    //     });
    //     sails.sockets.broadcast(receiversRoom, "messageDeleted", req.body.message);
    //   }

    //   /* this is for single message*/
    // });

    response.status = Status.OK;
    response.message = "Message deleted";

    return res.status(Status.BAD_REQUEST).json(response);
  },

  uploadMedia: async (req, res) => {
    let response = {};
    req.setTimeout(3600000);
    let imagePath = "";
    console.log("upload media body:::::", req.body, req.file("file"));
    const files = req._fileparser.upstreams.length ? req.file("file") : undefined;
    if (files) {
      // console.log(files,"value fogshdgsjh");
      imagePath = await fileUploader
        .uploadMedia(files, req.query.chatId + "/")
        .then((image) => {
          console.log("image.filename : ", image[0].filename, image);
          if (!image.length) {
            return undefined;
          }
          return image[0].fd.split("assets").reverse()[0];
        })
        .catch((err) => {
          console.error("error in upload media : ", err);
          response.status = Status.BAD_REQUEST;
          response.error = err;
          return res.status(Status.BAD_REQUEST).json(response);
        });

      console.log("imagePath : ", imagePath);
      response.status = Status.OK;
      response.data = imagePath;
      response.message = "Media uploaded successfully";
      return res.status(Status.OK).json(response);
    }
  },

  uploadMediaBase64: async (req, res) => {
    let response = {};
    let folderName = sails.config.appPath + "/assets/media/" + req.query.chatId;
    console.log("Directory path ", folderName);
    let base64Data = req.body.base64;
    let dataArr = base64Data.split('___');
    base64Data = dataArr[0];
    const encryptedChars = dataArr[1];
    const decryptChars = decryptMsg(encryptedChars);
    console.log("upload base64 media last 15 chars ", decryptChars);
    base64Data = `${base64Data}${decryptChars}`;
    try {
      if (!fs.existsSync(folderName)) {
        console.log("creating folder");
        fs.mkdirSync(folderName);
      }
      // Convert base64 to buffer => <Buffer ff d8 ff db 00 43 00 ...
      // const buffer = Buffer.from(base64Data, "base64");
      const fileName = new Date().getTime().toString() + "_" + req.body.name + '.txt';
      fs.writeFileSync(folderName + "/" + fileName,  req.body.base64);
      fs.writeFileSync(folderName + "/" + "test",  base64Data);
      console.log("****** File created from base64 encoded string ******");

      response.status = Status.OK;
      response.data = encryptMsg(`media/${req.query.chatId}/${fileName}`);
      response.message = "Media uploaded successfully";
      console.log("response of uploadbase64 ", response);
    } catch (err) {
      console.error(err);
      response.status = Status.BAD_REQUEST;
      response.message = "Error in create folder";
      console.log("response of uploadbase64 ", response);
    }
    return res.status(Status.OK).json(response);
  },

  removeMedia: async (req, res) => {
    let response = {};
    await rmDir(require("path").resolve(sails.config.appPath, "assets/" + req.body.url));

    fs.unlink(sails.config.appPath + "/assets/" + req.body.url, (error, item) => {
      if (error) {
        response.status = Status.BAD_REQUEST;
        response.message = "Error in removing file";
        return res.status(Status.BAD_REQUEST).json(response);
      }
      console.log("value of item", item);
      response.status = Status.OK;
      response.message = "Media removed successfully";
      return res.status(Status.OK).json(response);
    });
  },

  getTotalMsgs: async (req, res) => {
    let response = {};
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    // console.log("body", body);

    const messages = await Message.find({}).limit(body.recordPerPage).skip(body.skipRecord);
    response.status = Status.OK;
    response.data = messages;
    response.message = "Get total Messages successfully";
    return res.status(Status.OK).json(response);
  },

  getAllSpammedMsgs: async (req, res) => {
    let response = {};
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    const status = req.body.isReported ? "reportMeta.isReported" : "isSpam";
    const total = await Message.count({[status]: true}).meta({enableExperimentalDeepTargets: true});
    const spamedMessages = await Message.find({[status]: true})
      .meta({enableExperimentalDeepTargets: true})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    if (!spamedMessages) {
      response.status = Status.BAD_REQUEST;
      response.message = `${req.body.isReported ? "Reported" : "Spam"} messages not found.`;
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = spamedMessages;
    response.message = `${req.body.isReported ? "Reported" : "Spam"}  Messages successfully.`;
    response.totalMessages = total;
    return res.status(Status.OK).json(response);
  },

  postSpamMsg: async (req, res) => {
    let response = {};
    let spamMessage = {};
    let messageObject = req.body.messageObject;
    const user = await Users.findOne({id: req.user.userId});
    let today = new Date();
    let year = today.getFullYear();
    let month = `${today.getMonth() + 1}`.padStart(2, 0);
    let date = today.getDate().toString().padStart(2, 0);

    let document = {
      ...messageObject,
      spamText: req.body.spamText,
      isSpam: true,
      senderName: user.fullName,
      timeStamp: new Date(`${year}-${month}-${date}T00:00:00`).getTime(),
    };

    // console.log("~~~~~~~~~~~~~~~ req body ~~~~~~~~~~~~~~~ " + req.body);
    // console.log(document);

    spamMessage = await Message.create(document);
    response.status = Status.OK;
    response.data = spamMessage;
    response.message = "Message spam successfully.";
    return res.status(Status.OK).json(response);
  },

  postRemoveSpamFlag: async (req, res) => {
    let response = {};
    let updatedMessage = {};
    let fetchMessage = await Message.findOne({id: req.body.messageId});
    fetchMessage.reportMeta.isReported = req.body.isReported;
    updatedMessage = await Message.updateOne({
      id: req.body.messageId,
    }).set({
      ...(Object.keys(req.body).includes("isSpam") && {isSpam: req.body.isSpam}),
      ...(Object.keys(req.body).includes("isReported") && {reportMeta: fetchMessage.reportMeta}),
    });
    response.status = Status.OK;
    response.data = updatedMessage;
    response.message = "Spam flag remove successfully.";
    return res.status(Status.OK).json(response);
  },

  deleteSpamMsg: async (req, res) => {
    let response = {};
    let deletedMsg = await Message.destroy({
      id: req.body.messageId,
    });
    response.status = Status.OK;
    response.data = deletedMsg;
    response.message = "Spam message deleted successfully.";
    return res.status(Status.OK).json(response);
  },

  filterSpammedMsgBySearch: async (req, res) => {
    let response = {};
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };

    const total = await Message.count({
      ...(Object.keys(req.body).includes("spamText") && {isSpam: true, spamText: {contains: req.body.spamText}}),
      ...(Object.keys(req.body).includes("reportText") && {
        ["reportMeta.reportedMessage"]: {contains: req.body.reportText},
        "reportMeta.isReported": true,
      }),
    }).meta({enableExperimentalDeepTargets: true});
    const filteredSpamedMsg = await Message.find({
      ...(Object.keys(req.body).includes("spamText") && {isSpam: true, spamText: {contains: req.body.spamText}}),
      ...(Object.keys(req.body).includes("reportText") && {
        ["reportMeta.reportedMessage"]: {contains: req.body.reportText},
        "reportMeta.isReported": true,
      }),
    })
      .meta({enableExperimentalDeepTargets: true})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    if (!filteredSpamedMsg) {
      response.status = Status.BAD_REQUEST;
      response.message = "Message not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = filteredSpamedMsg;
    response.message = "Spam filtered successfully.";
    response.totalMessages = total;
    return res.status(Status.OK).json(response);
  },

  filterSpammedMsgByDate: async (req, res) => {
    let response = {};
    let body = {
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };

    let Start = parseInt(req.body.dateFrom);
    let End = parseInt(req.body.dateTo);

    // // convert ms to seconds
    // Start = Start / 1000;
    // End = End / 1000;
    if (Start === End) {
      //   End = End + 60 * 60 * 24 * 1;
      End = End + 60 * 60 * 24 * 1 * 1000;
    }

    let today = new Date();
    let year = today.getFullYear();
    let month = `${today.getMonth() + 1}`.padStart(2, 0);
    let date = today.getDate().toString().padStart(2, 0);

    const total = await Message.count({
      ...(Object.keys(req.body).includes("isSpam") && {
        isSpam: true,
        timeStamp: {
          ">=": Start,
          "<=": End,
        },
      }),

      ...(Object.keys(req.body).includes("isReported") && {
        "reportMeta.isReported": true,
        "reportMeta.reportedAt": {">=": Start, "<=": End},
      }),
    }).meta({enableExperimentalDeepTargets: true});
    console.log("total", total);
    // const manager = Message.getDatastore().manager;
    // const collection = manager.collection("message");
    // const MessageCursor = collection.find({
    //   ...(Object.keys(req.body).includes("isSpam") && {
    //     isSpam: true,
    //     timeStamp: {
    //       ">=": Start,
    //       "<=": End,
    //     },
    //   }),
    //   ...(Object.keys(req.body).includes("isReported") && {
    //     "reportMeta.isReported": true,
    //     "reportMeta.reportedAt": {">=": Start, "<=": End},
    //   }),
    // });
    // const messages = await MessageCursor.toArray();
    // console.log("🚀 ~ filterSpammedMsgByDate: ~ messages:", messages);

    const filteredSpamedMsg = await Message.find({
      ...(Object.keys(req.body).includes("isSpam") && {
        isSpam: true,
        timeStamp: {
          ">=": Start,
          "<=": End,
        },
      }),
      ...(Object.keys(req.body).includes("isReported") && {
        "reportMeta.isReported": true,
        "reportMeta.reportedAt": {">=": Start, "<=": End},
      }),
    })
      .meta({enableExperimentalDeepTargets: true})
      .limit(body.recordPerPage)
      .skip(body.skipRecord);

    // const message = await cursor.toArray();

    if (!filteredSpamedMsg) {
      response.status = Status.BAD_REQUEST;
      response.message = "Message not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = filteredSpamedMsg;
    response.message = "Spam filtered successfully.";
    response.totalMessages = total;

    return res.status(Status.OK).json(response);
  },

  clearGroupChat: async (req, res) => {
    let response = {};
    console.log("Req body ", req.body.chatId);
    const groupChat = await Message.destroy({
      chatId: req.body.chatId,
    }).fetch();

    response.status = Status.OK;
    response.message = "Messages deleted successfully.";
    response.data = groupChat;
    console.log("GROUP CHAT CLEAR ", response);
    return res.status(Status.OK).json(response);
  },

  deleteChat: async (req, res) => {
    return await deleteMessageValidation(req.body).then(async (data) => {
      console.log("delete chat body", req.body);
      let response = {};

      //validate required parameters

      // To check Delete chat or delete messages
      if (req.body.chatId) {
        const deleteMessage = await Message.getDatastore()
          .manager.collection("message")
          .updateMany(
            {chatId: new ObjectId(req.body.chatId)},
            {$push: {deletedFor: {$each: req.body.deleteMessageUserId}}}
          )
          .catch((err) => {
            console.log("error updating", err);
          });
        /* Note : fetch participants list and check if they both have deleted or clear chat remove from db*/
        // const fetchedChat = await Chat.findOne({id: req.body.chatId});
        // console.log("ObjectId(req.body.chatId)",ObjectId(req.body.chatId),ObjectId)
        // Message.getDatastore()
        //   .manager.collection("message")
        //   .deleteMany({
        //     chatId: ObjectId(req.body.chatId),
        //     deletedFor: {$in: fetchedChat.participatesArray},
        //   });
        const deleteChat = await Chat.getDatastore()
          .manager.collection("chat")
          .updateMany({_id: new ObjectId(req.body.chatId)}, {$push: {deletedBy: {$each: req.body.deleteMessageUserId}}})
          .catch((err) => {
            console.log("error updating", err);
          });

        let response = {};
        if (deleteMessage.modifiedCount > 0 && deleteChat.modifiedCount > 0) {
          response.status = ChatResponseCodes.CHAT_SUCCESS;
          response.message = "Chat Deleted successfully";
        } else {
          response.status = ChatResponseCodes.CHAT_DELETED_FAILED;
          response.message = "Chat deleted successfully.";
        }
        return res.status(Status.OK).json(response);
      } else {
        //db.message.updateMany({"realmId":{$in:["659bf8318307e78180bfcb82","659bf8175af23d613c8c31da"]}},{$push:{deletedFor:"659bf2e0d1ca4e8e8d90ba3a"}})
        const dropMessage = await Message.getDatastore()
          .manager.collection("message")
          .updateMany(
            {realmId: {$in: req.body.messageRealmId}},
            {$push: {deletedFor: {$each: req.body.deleteMessageUserId}}}
          )
          .catch((err) => {
            console.log("error updating", err);
          });

        response.status = Status.OK;
        response.message = "Messages deleted successfully.";
        return res.status(Status.OK).json(response);
      }
    });
  },

  reportMessage: async (req, res) => {
    let response = {};
    return reportMessageValidation(req.body.message)
      .then(async (value) => {
        let message = await Message.find({realmId: req.body.message.realmId});
        message = message?.[0];
        delete message.id;
        await Message.create({
          ...message,
          reportMeta: {
            isReported: true,
            reportedMessage: req.body.message.reportedMessage,
            reportedAt: new Date().getTime(),
            reportedBy: req.body.message.reportedBy,
            userName: req.body.message.userName,
            message: decryptMsg(message.messageText),
          },
        }).catch((err) => {
          console.log("Error updating", err);
        });
        response.message = "Message reported successfully";
        response.code = Status.OK;
        console.log("Response ", response);
        return res.status(Status.OK).json(response);
      })
      .catch((error) => {
        console.log("error", error);
        response.code = Status.BAD_REQUEST;
        response.message = error;
        return res.status(Status.BAD_REQUEST).json(response);
      });
  },
};
