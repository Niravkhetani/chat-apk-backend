// const Chat = require("../models/Chat");

/**
 * ChatController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const Status = sails.config.constants.ResponseCodes;
const ChatResponseCodes = sails.config.constants.ChatResponseCodes;
const MessageResponseCodes = sails.config.constants.MessageResponseCodes;
const groupImageURL = sails.config.constants.GroupProfile;
var {ObjectId} = require("bson");

function nativeMongoQuery(model, cnt) {
  const collection = model.getDatastore().manager.collection(model.tableName);

  let callCnt = 0;

  let req;

  const proxy = new Proxy(
    {},
    {
      get:
        (_, method) =>
        (...args) => {
          if (!req) req = collection[method](...args);
          else req = req[method](...args);

          callCnt++;

          if (callCnt === cnt) {
            return (async function () {
              const rawDataArr = await req.toArray();
              return JSON.parse(JSON.stringify(rawDataArr).replace(/"_id"/g, '"id"'));
            })();
          } else {
            return proxy;
          }
        },
    }
  );

  return proxy;
}

module.exports = {
  /*
	  creating chat between two users..and also for a perticular group by updating
	  'isGroup' flag to 'true'.
	*/
  createChat: async (req, res) => {
    let response = {};
    let userChat;

    console.log("Create Chat called");

    // find if chat already exist
    const participatedUsers = req.body.participates;
    let newParticipates = [];
    console.log("participatedUsers : ", req.body.participates);

    // find if destinationUser is verified or not
    let destinationUser = await Users.find({
      id: participatedUsers,
      // id: { in: req.body.participates },
    }).catch((err) => {
      response.status = Status.BAD_REQUEST;
      response.error = err;
      return res.status(Status.BAD_REQUEST).json(response);
    });
    console.log("destinationUser : ", destinationUser);
    // return res.status(Status.BAD_REQUEST).json(response);

    if (!destinationUser.length) {
      response.status = Status.BAD_REQUEST;
      response.error = "No User exist";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    if (!req.body.isGroup) {
      console.log("participates : ", req.body.participates[0]);

      if (req.body.participates.length === 1) {
        userChat = await nativeMongoQuery(Chat, 1).find({
          $or: [
            {
              participatesArray: {
                $eq: [req.body.participates[0], req.user.userId],
              },
            },
            {
              participatesArray: {
                $eq: [req.user.userId, req.body.participates[0]],
              },
            },
          ],
          isGroup: req.body.isGroup,
        });

        console.log("existence userChat : ", userChat);

        if (userChat.length) {
          const populatedChat = await Chat.findOne({
            id: userChat[0].id,
            // isGroup: isGroup,
          })
            .populate("participates", {
              where: {id: {"!=": [req.user.userId]}},
            })
            .catch((error) => {
              response.status = Status.BAD_REQUEST;
              response.error = "No chat available";
              return res.status(Status.BAD_REQUEST).json(response);
            });
          response.status = Status.OK;
          response.data = populatedChat;
          response.message = "chat retrived successfully";
          return res.status(Status.OK).json(response);
        }
      } else {
        response.status = Status.BAD_REQUEST;
        response.error = "Data is not sufficient";
        return res.status(Status.BAD_REQUEST).json(response);
      }
    } else {
      if (!(req.body.participates.length >= 1) && !req.body.groupName) {
        console.log("Insufficient data");
        response.status = Status.BAD_REQUEST;
        response.error = "Insufficient data";
        return res.status(Status.BAD_REQUEST).json(response);
      }
    }
    participatedUsers.push(req.user.userId);

    let data = {
      participates: participatedUsers,
      participatesArray: participatedUsers,
      isGroup: req.body.isGroup,
    };
    if (req.body.isGroup) {
      let filteredUser = [req.user.userId];
      destinationUser.forEach((user, index) => {
        if (user.group === "Everyone") {
          filteredUser.push(user.id);
        }
      });
      data.groupName = req.body.groupName;
      data.adminList = [req.user.userId];
      data.participates = filteredUser;
      data.participatesArray = filteredUser;
      // data.groupImage = req.body.groupImage;
    }

    // if users are verified then create new chat between them..
    let createdChat = await Chat.create(data)
      .fetch()
      .catch((error) => {
        response.status = Status.BAD_REQUEST;
        response.error = error;
        return res.status(Status.BAD_REQUEST).json(response);
      });

    const populatedChat = await Chat.findOne({
      id: createdChat.id,
    })
      .populate("participates", {
        where: {id: {"!=": [req.user.userId]}},
      })
      .catch((error) => {
        response.status = Status.BAD_REQUEST;
        response.error = "No chat available";
        return res.status(Status.BAD_REQUEST).json(response);
      });

    // req.body.participates.map(async user => {
    //   console.log('Socket call for user ', user);

    //   const populatedChat = await Chat.findOne({
    //     id: createdChat.id
    //   })
    //   .populate("participates", {
    //     where: {id: {"!=": user}},
    //   });
    //   sails.sockets.broadcast(user, "newChatCreated", populatedChat);
    // });

    response.status = Status.OK;
    response.data = populatedChat;
    response.message = "Chat created succesfully";
    return res.status(Status.OK).json(response);
  },

  /*
	user can upload their group profile photo and updating that image path to..
	assets/group/profile/chatId/groupProfile.jpg.
	*/
  uploadGroupImage: async (req, res) => {
    let response = {};
    let serverURL = `${req.protocol}://${req.get("host")}/`;
    let groupImagePath = "";
    let createdChat = "";
    try {
      const files = req._fileparser.upstreams.length ? req.file("file") : undefined;
      console.log("req.query.chatId : ", req.query.chatId);
      if (files) {
        // console.log(files,"value fogshdgsjh");
        groupImagePath = await fileUploader
          .uploadGroupProfile(files, req.query.chatId)
          .then((image) => {
            console.log("uploaded image data : ", image);
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
        console.log("Group Image ", serverURL + groupImagePath);
        createdChat = await Chat.updateOne({
          id: req.query.chatId,
        }).set({
          groupImage: encodeURI(serverURL + groupImagePath),
        });
        console.log("groupImagePath : ", groupImagePath);
        response.status = Status.OK;
        response.data = createdChat;
        response.message = "User updated successfully";
        return res.status(Status.OK).json(response);
      } else {
        console.log("else part is called");
      }
    } catch (error) {
      response = {
        status: Status.BAD_REQUEST,
        message: "Unable to upload group profile image.",
      };
      return res.status(Status.BAD_REQUEST).json(response);
    }
  },

  /*
	get chat with users references... by populating a participates users..
	*/
  getChat: async (req, res) => {
    let response = {};

    const sorted_users = await Chat.find({
      participatesArray: {
        in: [req.user.userId],
      },
      // isGroup: isGroup,
    })
      .populate("participates", {where: {id: {"!=": [req.user.userId]}}})
      .sort([{updatedAt: "DESC"}])
      .catch((error) => {
        response.status = Status.BAD_REQUEST;
        response.error = "No chat available";
        return res.status(Status.BAD_REQUEST).json(response);
      });
    if (!sorted_users.length) {
      response.status = Status.BAD_REQUEST;
      response.error = "No chat available";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = sorted_users;
    // console.log("response.data", response.data)
    response.message = "chat retrived successfully";

    return res.status(Status.OK).send(response);
  },

  getChatV2: async (req, res) => {
    const response = {};
    // console.log('REQ query ', req.query);

    let {limit = 25, page = 1} = req.query || {};
    // if (limit > 25) {
    //   limit = 25;
    // }
    if (page <= 0) {
      page = 1;
    }
    page = page - 1;
    try {
      const output = await nativeMongoQuery(Chat, 1).aggregate([
        {$match: {participatesArray: {$in: [req.user.userId]}}},
        {
          $lookup: {
            from: "chat_participates__users_participates_users",
            foreignField: "chat_participates",
            localField: "_id",
            as: "participates",
          },
        },
        {$unwind: {path: "$participates", preserveNullAndEmptyArrays: true}},
        {
          $lookup: {
            from: "users",
            localField: "participates.users_participates_users",
            foreignField: "_id",
            as: "UserName",
          },
        },
        {
          $lookup: {
            from: "message",
            //   localField: "_id",
            //   foreignField: "chatId",
            as: "Messages",
            let: {chatId: "$_id"},
            pipeline: [
              {
                $match: {
                  $expr: {$eq: ["$chatId", "$$chatId"]},
                  deletedFor: {$nin: [req.user.userId]},
                  $or: [
                    {isGroup: true},
                    {$or: [{messageType: {$ne: "LOG"}}, {messageType: "LOG", sender: req.user.userId}]},
                  ],
                  //   $and: [{isGroup: {$ne: true}}, {messageType: "LOG"}, {sender: req.user.userId}],
                },
              },
              {$sort: {createdAt: -1}},
              {$limit: 1},
            ],
          },
        },
        {
          $group: {
            _id: "$_id",
            participates: {$push: "$UserName"},
            isGroup: {$first: "$isGroup"},
            createdAt: {$first: "$createdAt"},
            updatedAt: {$first: "$updatedAt"},
            groupImage: {$first: "$groupImage"},
            groupName: {$first: "$groupName"},
            archiveBy: {$first: "$archiveBy"},
            deletedBy: {$first: "$deletedBy"},
            isActive: {$first: "$isActive"},
            lastMessageId: {$first: "$lastMessageId"},
            adminList: {$first: "$adminList"},
            Messages: {$first: "$Messages"},
            unReadMessageCount: {$first: "$unreadMessageCount"},
          },
        },
        {$sort: {createdAt: -1}},
        {
          $facet: {
            chats: [{$skip: page * limit}, {$limit: parseInt(limit)}],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);
      // console.log('Chats output of query ', output);

      //Remove current User from participates array
      output?.[0]?.chats?.map((item, chatIdx) => {
        item.participates.map((innerItem, userIdx) => {
          // console.log("user id", innerItem[0], req.user.userId);
          if (innerItem.length && innerItem[0].id !== req.user.userId) {
            output[0].chats[chatIdx].participates[userIdx] = innerItem[0];
          } else {
            delete output[0].chats[chatIdx].participates[userIdx];
          }
        });
        //flag required for frontend to get
        if (output.length > 0 && output[0].chats[chatIdx].Messages?.length > 0) {
          output[0].chats[chatIdx].Messages[0].isFailed = false;
          output[0].chats[chatIdx].Messages[0].isSent = true;
        }
      });
      response.code = output.length > 0 ? ChatResponseCodes.CHAT_SUCCESS : ChatResponseCodes.CHAT_NOT_FOUND;
      response.data = output;
      response.message = output.length > 0 ? "Chat retrieved successfully" : "Chat not found";
      response.success = true;
    } catch (err) {
      response.code = ChatResponseCodes.CHAT_FETCH_FAILED;
      response.data = {};
      response.message = "Chat fetch failed";
      response.success = false;
      console.log("Error occurred while fetching Chats in getChatV2", err);
    }
    res.status(Status.OK).json(response);
  },

  getUserChat: async (req, res) => {
    const response = {};
    // console.log('REQ QUERY ', req.query);
    // console.log('REQ user ', req.user);

    let {limit = 10, page = 1} = req.query || {};

    if (page <= 0) {
      page = 1;
    }
    page = page - 1;
    try {
      const output = await nativeMongoQuery(Chat, 1).aggregate([
        {$match: {participatesArray: {$in: [req.user.userId]}, isGroup: false}},
        {
          $lookup: {
            from: "chat_participates__users_participates_users",
            foreignField: "chat_participates",
            localField: "_id",
            as: "participates",
          },
        },
        {$unwind: {path: "$participates", preserveNullAndEmptyArrays: true}},
        {
          $lookup: {
            from: "users",
            localField: "participates.users_participates_users",
            foreignField: "_id",
            as: "UserName",
          },
        },
        {
          $lookup: {
            from: "message",
            //   localField: "_id",
            //   foreignField: "chatId",
            as: "Messages",
            let: {chatId: "$_id"},
            pipeline: [
              {
                $match: {
                  $expr: {$eq: ["$chatId", "$$chatId"]},
                  deletedFor: {$nin: [req.user.userId]},
                  $and: [
                    {isGroup: false},
                    {$or: [{messageType: {$ne: "LOG"}}, {messageType: "LOG", sender: new ObjectId(req.user.userId)}]},
                  ],
                  //   $and: [{isGroup: {$ne: true}}, {messageType: "LOG"}, {sender: req.user.userId}],
                },
              },
              {$sort: {createdAt: -1}},
              {$limit: 1},
            ],
          },
        },
        {
          $group: {
            _id: "$_id",
            participates: {$push: "$UserName"},
            isGroup: {$first: "$isGroup"},
            createdAt: {$first: "$createdAt"},
            updatedAt: {$first: "$updatedAt"},
            groupImage: {$first: "$groupImage"},
            groupName: {$first: "$groupName"},
            archiveBy: {$first: "$archiveBy"},
            deletedBy: {$first: "$deletedBy"},
            isActive: {$first: "$isActive"},
            lastMessageId: {$first: "$lastMessageId"},
            adminList: {$first: "$adminList"},
            Messages: {$first: "$Messages"},
            unreadMessageCount: {$first: "$unreadMessageCount"},
          },
        },
        {$sort: {createdAt: -1}},
        {
          $facet: {
            chats: [{$skip: page * limit}, {$limit: parseInt(limit)}],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);
      // console.log('Chats output of query ', output);

      //Remove current User from participates array
      output?.[0]?.chats?.map((item, chatIdx) => {
        item.participates.map((innerItem, userIdx) => {
          // console.log("user id", innerItem[0], req.user.userId);
          if (innerItem.length && innerItem[0].id !== req.user.userId) {
            output[0].chats[chatIdx].participates[userIdx] = innerItem[0];
          } else {
            delete output[0].chats[chatIdx].participates[userIdx];
          }
        });
        //flag required for frontend to get
        if (output.length > 0 && output[0].chats[chatIdx].Messages?.length > 0) {
          output[0].chats[chatIdx].Messages[0].isFailed = false;
          output[0].chats[chatIdx].Messages[0].isSent = true;
        }
      });
      response.code = output.length > 0 ? ChatResponseCodes.CHAT_SUCCESS : ChatResponseCodes.CHAT_NOT_FOUND;
      response.data = output;
      response.message = output.length > 0 ? "Chat retrieved successfully" : "Chat not found";
      response.success = true;
    } catch (err) {
      response.code = ChatResponseCodes.CHAT_FETCH_FAILED;
      response.data = {};
      response.message = "Chat fetch failed";
      response.success = false;
      console.log("Error occurred while fetching Chats in getUserchat", err);
    }
    res.status(Status.OK).json(response);
  },

  getGroupChat: async (req, res) => {
    const response = {};
    // console.log('REQ QUERY ', req.query);
    // console.log('REQ user ', req.user);

    let {limit = 10, page = 1} = req.query || {};

    if (page <= 0) {
      page = 1;
    }
    page = page - 1;
    try {
      const output = await nativeMongoQuery(Chat, 1).aggregate([
        {$match: {participatesArray: {$in: [req.user.userId]}, isGroup: true}},
        {
          $lookup: {
            from: "chat_participates__users_participates_users",
            foreignField: "chat_participates",
            localField: "_id",
            as: "participates",
          },
        },
        {$unwind: {path: "$participates", preserveNullAndEmptyArrays: true}},
        {
          $lookup: {
            from: "users",
            localField: "participates.users_participates_users",
            foreignField: "_id",
            as: "UserName",
          },
        },
        {
          $lookup: {
            from: "message",
            //   localField: "_id",
            //   foreignField: "chatId",
            as: "Messages",
            let: {chatId: "$_id"},
            pipeline: [
              {
                $match: {
                  $expr: {$eq: ["$chatId", "$$chatId"]},
                  deletedFor: {$nin: [req.user.userId]},
                  $or: [
                    {isGroup: true},
                    {$or: [{messageType: {$ne: "LOG"}}, {messageType: "LOG", sender: req.user.userId}]},
                  ],
                  //   $and: [{isGroup: {$ne: true}}, {messageType: "LOG"}, {sender: req.user.userId}],
                },
              },
              {$sort: {createdAt: -1}},
              {$limit: 1},
            ],
          },
        },
        {
          $group: {
            _id: "$_id",
            participates: {$push: "$UserName"},
            isGroup: {$first: "$isGroup"},
            createdAt: {$first: "$createdAt"},
            updatedAt: {$first: "$updatedAt"},
            groupImage: {$first: "$groupImage"},
            groupName: {$first: "$groupName"},
            archiveBy: {$first: "$archiveBy"},
            deletedBy: {$first: "$deletedBy"},
            isActive: {$first: "$isActive"},
            lastMessageId: {$first: "$lastMessageId"},
            adminList: {$first: "$adminList"},
            Messages: {$first: "$Messages"},
            unreadMessageCount: {$first: "$unreadMessageCount"},
          },
        },
        {$sort: {createdAt: -1}},
        {
          $facet: {
            chats: [{$skip: page * limit}, {$limit: parseInt(limit)}],
            totalCount: [
              {
                $count: "count",
              },
            ],
          },
        },
      ]);
      // console.log('Chats output of query ', output);

      //Remove current User from participates array
      output?.[0]?.chats?.map((item, chatIdx) => {
        item.participates.map((innerItem, userIdx) => {
          // console.log("user id", innerItem[0], req.user.userId);
          if (innerItem.length && innerItem[0].id !== req.user.userId) {
            output[0].chats[chatIdx].participates[userIdx] = innerItem[0];
          } else {
            delete output[0].chats[chatIdx].participates[userIdx];
          }
        });
        //flag required for frontend to get
        if (output.length > 0 && output[0].chats[chatIdx].Messages?.length > 0) {
          output[0].chats[chatIdx].Messages[0].isFailed = false;
          output[0].chats[chatIdx].Messages[0].isSent = true;
        }
      });
      response.code = output.length > 0 ? ChatResponseCodes.CHAT_SUCCESS : ChatResponseCodes.CHAT_NOT_FOUND;
      response.data = output;
      response.message = output.length > 0 ? "Chat retrieved successfully" : "Chat not found";
      response.success = true;
    } catch (err) {
      response.code = ChatResponseCodes.CHAT_FETCH_FAILED;
      response.data = {};
      response.message = "Chat fetch failed";
      response.success = false;
      console.log("Error occurred while fetching Chats in getGroupChat", err);
    }
    res.status(Status.OK).json(response);
  },

  getChatsById: async (req, res) => {
    let response = {};
    // console.log("@@@@@@@@@@@  getChatsById @@@@@@@@@@2", JSON.stringify(req.user, null, 2));

    const messages = await Message.find({
      chatId: req.params.chatId,
    });

    response.data = messages;
    return res.status(Status.OK).send(response);
  },
  getChatsByIdV2: async (req, res) => {
    let response = {};
    let {limit = 25, page = 1} = req.query || {};
    if (limit > 25) {
      limit = 25;
    }
    if (page <= 0) {
      page = 1;
    }
    page = page - 1;
    try {
      console.log("req.user.userId", req.user.userId);
      const messages = await Chat.getDatastore()
        .manager.collection("message")
        .find({
          chatId: new ObjectId(req.params.chatId),
          deletedFor: {$nin: [req.user.userId]},
          $or: [
            {isGroup: true},
            {messageType: "IMAGE"},
            {messageType: "TEXT"},
            {messageType: "CONTACT"},
            {messageType: "LOG", sender: new ObjectId(req.user.userId), isGroup: false},
            // {messageType: "LOG", isGroup: false, sender: new ObjectId(req.user.userId)},
          ],
        })
        .sort({createdAt: -1})
        .limit(parseInt(limit))
        .skip(limit * page);
      const documents = await messages.toArray();
      let messageCount = await Chat.getDatastore()
        .manager.collection("message")
        .count({
          chatId: new ObjectId(req.params.chatId),
          deletedFor: {$nin: [req.user.userId]},
          $or: [
            {isGroup: true},
            {messageType: "IMAGE"},
            {messageType: "TEXT"},
            {messageType: "CONTACT"},
            // {messageType: "IMAGE", messageType: "TEXT", messageType: "CONTACT"},
            {messageType: {$ne: "LOG"}, sender: new ObjectId(req.user.userId), isGroup: false},
          ],
        });
      response.code = messageCount > 0 ? MessageResponseCodes.MESSAGE_SUCCESS : MessageResponseCodes.MESSAGE_NOT_FOUND;
      response.data = {messages: documents, totalCount: messageCount};
      response.message = "Message fetch successfully";
      response.success = true;
    } catch (err) {
      response.code = MessageResponseCodes.MESSAGE_FETCH_FAILED;
      response.data = {};
      response.message = "Message fetch failed";
      response.success = true;
      console.log("Error occurred while fetching messages", err);
    }
    return res.status(Status.OK).send(response);
  },

  /*
  add a perticular member to the group, if a group is exits by updating participatesArray
  and add user reference to the participates...
  */
  addUserToGroup: async (req, res) => {
    let response = {};
    console.log("req body : ", req.body);
    let getGroupChat = await Chat.findOne({
      id: req.body.chatId,
      isGroup: true,
    });

    if (!getGroupChat) {
      response.code = Status.BAD_REQUEST;
      response.message = "Group is not available";
      return res.status(Status.OK).json(response);
    }

    // console.log("getGroupChat : ", getGroupChat);

    if (!getGroupChat.adminList.includes(req.user.userId)) {
      response.code = Status.BAD_REQUEST;
      response.message = "Only admin can add a user";
      return res.status(Status.OK).json(response);
    }

    let participates = getGroupChat.participatesArray;
    console.log("Before add participates ", participates);

    req.body.usersId.forEach((id) => {
      if (!participates.includes(id)) {
        participates.push(id);
      }
    });
    console.log("AFter add participates : ", participates);
    let participatesObjectIds = participates.map((p) => new ObjectId(p));
    console.log("New participates object ids : ", participatesObjectIds);

    for (let i = 0; i < req.body.usersId.length; i++) {
      const inserted = await Chat.getDatastore()
        .manager.collection("chat_participates__users_participates_users")
        .insertOne({
          users_participates_users: new ObjectId(req.body.usersId[i]),
          chat_participates: new ObjectId(req.body.chatId),
        });
      console.log("inserted", inserted);
    }

    await Chat.updateOne({
      id: req.body.chatId,
      isGroup: true,
    }).set({
      participatesArray: participates,
    });

    let updatedGroup = await Chat.findOne({
      id: req.body.chatId,
      isGroup: true,
    }).populate("participates", {where: {id: {"!=": req.user.userId}}});

    console.log("After Updating : ", updatedGroup);
    response.status = Status.OK;
    response.data = updatedGroup;
    response.message = "User added successfully";
    return res.status(Status.OK).send(response);
  },

  /*
  remove a perticular member from the group, if a group is exits by updating participatesArray
  and add user reference to the participates...
  */
  removeUserFromGroup: async (req, res) => {
    let response = {};
    let getGroupChat = await Chat.findOne({
      id: req.body.chatId,
      isGroup: true,
    });

    if (!getGroupChat) {
      response.code = Status.BAD_REQUEST;
      response.message = "Group is not available";
      return res.status(Status.OK).json(response);
    }

    // console.log("getGroupChat : ", getGroupChat);

    if (!getGroupChat.adminList.includes(req.user.userId)) {
      response.code = Status.BAD_REQUEST;
      response.message = "Only admin can remove a user";
      return res.status(Status.OK).json(response);
    }

    if (!getGroupChat.participatesArray.includes(req.body.userId)) {
      response.code = Status.BAD_REQUEST;
      response.message = "Requested user is not there in the group";
      return res.status(Status.OK).json(response);
    }

    let participates = getGroupChat.participatesArray;
    let updatedParticipates = participates.filter((user) => user !== req.body.userId);
    console.log("Updated users : ", updatedParticipates);

    const deleted = await Chat.getDatastore()
      .manager.collection("chat_participates__users_participates_users")
      .deleteOne({
        users_participates_users: new ObjectId(req.body.userId),
        chat_participates: new ObjectId(req.body.chatId),
      });

    let updatedAdminList = getGroupChat.adminList.filter((admin) => admin !== req.body.userId);

    let updatedGroup = await Chat.updateOne({
      id: req.body.chatId,
      isGroup: true,
    }).set({
      participatesArray: updatedParticipates,
      adminList: updatedAdminList,
    });

    sails.sockets.broadcast(req.body.userId, "removeUserFromGroup", {chatId: req.body.chatId});

    console.log("updated Group after remove user: ", updatedGroup);
    response.status = Status.OK;
    response.data = updatedGroup;
    response.message = "User removed successfully";
    return res.status(Status.OK).json(response);
  },

  /*
  add a perticular member as group admin to the group, if a group is exits by updating adminList,
  and, he must join the perticular group. bofore he became a group-admin.
  */
  addAdminToGroup: async (req, res) => {
    let response = {};
    let getGroupChat = await Chat.findOne({
      id: req.body.chatId,
      isGroup: true,
    });

    if (!getGroupChat) {
      response.status = Status.BAD_REQUEST;
      response.message = "Group is not available";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    if (!getGroupChat.adminList.includes(req.user.userId)) {
      response.status = Status.UNAUTHORIZED;
      response.message = "Only admin can make another Admin";
      return res.status(Status.OK).json(response);
    }

    if (getGroupChat.adminList.includes(req.body.userId)) {
      response.status = Status.FORBIDDEN;
      response.message = "User is already admin";
      return res.status(Status.OK).json(response);
    }

    if (!getGroupChat.participatesArray.includes(req.body.userId)) {
      response.status = Status.NOT_FOUND;
      response.message = "User is not there in the group";
      return res.status(Status.OK).json(response);
    }

    let adminList = getGroupChat.adminList;
    adminList.push(req.body.userId);
    console.log("updated adminList : ", adminList);

    let updatedGroup = await Chat.updateOne({
      id: req.body.chatId,
      isGroup: true,
    }).set({
      adminList: adminList,
    });

    console.log("Add admin in group : ", updatedGroup);
    response.status = Status.OK;
    response.data = updatedGroup;
    response.message = "admin added successfully";
    return res.status(Status.OK).json(response);
  },

  /*
  remove a perticular member as group admin from the group, if a group is exits by updating adminList,
  */
  removeAdminFromGroup: async (req, res) => {
    let response = {};
    console.log("userId in removeAdminFromGroup : ", req.user.userId);

    let getGroupChat = await Chat.findOne({
      id: req.body.chatId,
      isGroup: true,
    });

    if (!getGroupChat) {
      console.log("Group is not available in remove admin");
      response.status = Status.BAD_REQUEST;
      response.message = "Group is not available";
      return res.status(Status.OK).json(response);
    }

    if (!getGroupChat.adminList.includes(req.user.userId)) {
      console.log("Only admin can remove another Admin in remove admin");
      response.status = Status.UNAUTHORIZED;
      response.message = "Only admin can remove another Admin";
      return res.status(Status.OK).json(response);
    }

    if (!getGroupChat.participatesArray.includes(req.body.userId)) {
      console.log("User is not there in the group in remove admin");
      response.status = Status.NOT_FOUND;
      response.message = "User is not there in the group";
      return res.status(Status.OK).json(response);
    }

    if (!getGroupChat.adminList.includes(req.body.userId)) {
      console.log("User is not group-admin in remove admin");
      response.status = Status.NOT_FOUND;
      response.message = "User is not group-admin";
      return res.status(Status.OK).json(response);
    }

    let adminList = getGroupChat.adminList;
    let updatedAdminList = adminList.filter((admin) => admin !== req.body.userId);
    console.log("updatedAdminList after removing admin : ", updatedAdminList);
    let updatedGroup = await Chat.updateOne({
      id: req.body.chatId,
      isGroup: true,
    }).set({
      adminList: updatedAdminList,
    });

    console.log("updatedGroup after removing admin : ", updatedGroup);

    response.status = Status.OK;
    response.data = updatedGroup;
    response.message = "admin removed successfully";

    return res.status(Status.OK).json(response);
  },

  /*
  if user wants to leave a perticular group then he can, by updating adminList,
  and, participates reference and participateArray..
  */
  leaveFromGroup: async (req, res) => {
    let response = {};

    let getGroupChat = await Chat.findOne({
      id: req.body.chatId,
      isGroup: true,
    });

    if (!getGroupChat) {
      response.status = Status.BAD_REQUEST;
      response.message = "Group is not available";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    let participates = getGroupChat.participatesArray;
    let updatedParticipates = participates.filter((user) => user !== req.user.userId);

    let adminList = getGroupChat.adminList;
    let updatedAdminList = adminList.filter((admin) => admin !== req.user.userId);
    let updatedGroup = await Chat.updateOne({
      id: req.body.chatId,
      isGroup: true,
    }).set({
      participates: updatedParticipates,
      participatesArray: updatedParticipates,
      adminList: updatedAdminList,
    });

    console.log("After leave group ", updatedGroup);
    response.status = Status.OK;
    response.data = updatedGroup;
    response.message = "You leaved successfully";
    return res.status(Status.OK).json(response);
  },

  updateGroupInfo: async (req, res) => {
    let response = {};
    let updatedChat = await Chat.updateOne({
      id: req.params.chatId,
    }).set({
      groupName: req.body.groupName,
    });

    if (!updatedChat) {
      response.status = Status.BAD_REQUEST;
      response.message = "Invalid chatId";

      return res.status(Status.BAD_REQUEST).json(response);
    }

    let getGroup = await Chat.findOne({
      id: updatedChat.id,
    }).populate("participates", {where: {id: {"!=": req.user.userId}}});

    // console.log("getGroup : ", getGroup);
    response.status = Status.OK;
    response.data = getGroup;
    response.message = "Group updated successfully";
    return res.status(Status.OK).json(response);
  },

  //Admin Panel APIs
  getAllGroups: async (req, res) => {
    let response = {};
    let groups = [];
    let body = {
      recordPerPage: req.body.recordPerPage,
      skipRecord: req.body.pageNumber > 1 ? (req.body.pageNumber - 1) * req.body.recordPerPage : 0,
      // sortBy: req.body.sortBy,
    };
    console.log("getAllGroups body", body);

    const total = await Chat.count({isGroup: true});
    groups = await Chat.find({isGroup: true}).limit(body.recordPerPage).skip(body.skipRecord);
    // groups =  await Chat.find({ isGroup: true }).sort(body.sortBy).limit(body.recordPerPage).skip(body.skipRecord);
    response.status = Status.OK;
    response.data = groups;
    response.message = "Get Groups successfully.";
    response.totalGroup = total;
    return res.status(Status.OK).json(response);
  },

  getGroupsYearWise: async (req, res) => {
    let response = {};
    const yearWiseGroups = await Chat.getDatastore()
      .manager.collection("chat")
      .aggregate([
        {
          $match: {
            isGroup: true,
          },
        },
        {
          $group: {
            _id: {
              $year: {$toDate: "$createdAt"},
            },
            groups: {$sum: 1},
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ])
      .toArray();

    // yearWiseGroups.push({_id: 2022, groups: 74},{_id: 2021, groups: 56}, {_id: 2020, groups: 72}, {_id: 2019, groups: 12})

    if (!yearWiseGroups) {
      response.status = Status.BAD_REQUEST;
      response.message = "Users not found.";
      return res.status(Status.BAD_REQUEST).json(response);
    }

    response.status = Status.OK;
    response.data = yearWiseGroups;
    response.message = "Get year wise groups successfully.";
    return res.status(Status.OK).json(response);
  },

  updateUnreadMessageCount: async (req, res) => {
    let response = {};
    console.log("Req body updateUnreadMessageCount ", req.body);
    let chat = await Chat.findOne({id: req.params.chatId});
    let previousCount = chat.unreadMessageCount;

    let payload = {
      unreadMessageCount: {
        ...previousCount,
        [req.body.userId]: req.body.unReadMessageCount,
      },
    };
    const updatedChat = await Chat.updateOne({id: req.params.chatId}).set(payload);
    // console.log('Chat want to update ', updatedChat);

    response.code = Status.OK;
    response.message = "Unread message count updated";
    return res.status(Status.OK).json(response);
  },

  nativeMongoQuery,
};
