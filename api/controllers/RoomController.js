const {subtract, assignWith, concat} = require("lodash");

/**
 * RoomController
 * using resoursefull public subscribe method..
 * https://sailsjs.com/documentation/reference/web-sockets/resourceful-pub-sub/get-room-name
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const Status = sails.config.constants.ResponseCodes;
sails.rooms = [];

module.exports = {
  // connecting a requested socket to the room...

  /**
   * Make connection to socket
   * @param {*} req
   * @param {*} res
   */
  connect: function (req, res) {
    let param = req.param("userId");

    sails.sockets.join(req.socket, param, async function (err) {
      if (err) {
        // console.log(err);
        return res.status(500).json({
          status: false,
          code: 500,
          message: "Internal Server Error",
        });
      } else {
        let index = -1;
        sails.rooms.map((room, i) => {
          console.log("param in room ", param, room);

          if (param in room) {
            index = i;
          }
        });
        // console.log("index in connect API : ", index);
        if (index < 0) {
          sails.rooms.push({
            [param]: req.socket.id,
            updatedAt: new Date().getTime(),
          });
          console.log("User added in sails socket ", sails.rooms);
        } else {
          sails.rooms[index].updatedAt = new Date().getTime();
          // console.log('After update sails connection ', sails.rooms);
        }
        // console.log("sails.rooms........", sails.rooms)
        let data = JSON.stringify(sails.session[param]);
        sails.session[param] = [];
        // console.log("Cleaning session", sails.session[param]);
        sails.sockets.blast("userOnline", {id: param});
        return res.status(200).json({
          status: true,
          code: 200,
          data: data ? JSON.parse(data) : [],
          message: "joined the room!",
        });
      }
    });
  },

  /**
   * Disconnects us from socket
   * @param {*} req
   * @param {*} res
   */
  disConnect: async function (req, res) {
    let response = {};
    const roomId = req.param("roomId");
    console.log("disConnect userID : ", userID);
    console.log("disConnect roomId : ", roomId);
    // for (let i = 0; i < SOCKET.length; i++) {
    //     if (SOCKET[i].userid == userId) {
    //         SOCKET.splice(i, 1);
    //         sails.sockets.blast('UserOfline', { userid: userId });
    //         // console.log('WHEN REMOVING SOCKET: ', SOCKET);
    //     }
    // }

    sails.sockets.leave(req.socket, roomId, async function (err) {
      if (err) {
        // console.log(err);
        response.status = Status.BAD_REQUEST;
        response.error = err;
        response.message = "Socket is not found";
        return res.status(Status.BAD_REQUEST).json(response);
      } else {
        // console.log("left")
        console.log("getUser : ", getUser);
        response.status = Status.OK;
        response.message = "left the room successfully";
        return res.status(Status.OK).json(response);
      }
    });
  },

  /*
  if receivers is active then whosoever is sending the message at that time receiver will get to know about
  that someone is typing.. using socket broadcasting
  */
  isTyping: async (req, res) => {
    let response = {};
    const chat = await Chat.find({
      id: req.body.chatId,
    });

    // console.log("chat : ", chat);

    let receiversRoom = chat[0].participatesArray.filter((e) => e !== req.body.userId);

    // console.log("receiver userId : ", receiversRoom);
    receiversRoom.forEach((receiver) => {
      sails.sockets.broadcast(receiver, "isTyping", {
        isTyping: req.body.isTyping,
        chatId: req.body.chatId,
        receiversRoom: receiver,
        activeUser: req.body.userId,
      });
    });
    response.status = Status.OK;
    response.message = "Status changed";
    return res.status(Status.OK).json(response);
  },

  /*
  if some user is online then user will get to know about that perticular user is online.
  */
  isOnline: async (req, res) => {
    let response = {};
    let isOnline = false;
    console.log("Sails room ", sails.rooms);

    sails.rooms.map((room, i) => {
      if (Object.keys(room)[0] === req.params.userId) {
        isOnline = true;
      }
    });
    response.status = Status.OK;
    response.data = {isOnline: isOnline};
    return res.status(Status.OK).json(response);
  },

  updateConnection: async (req, res) => {
    let response = {};
    let index = -1;
    // console.log('In update connection rooms ', sails.rooms);

    sails.rooms.map((room, i) => {
      let key = Object.keys(room).find((key) => room[key] === req.socket.id);
      if (key) {
        index = i;
      }
    });
    if (index >= 0) {
      sails.rooms[index].updatedAt = new Date().getTime();
    }
    // console.log("updated sails.rooms : ", sails.rooms);
    response.status = Status.OK;
    response.message = "time updated successfully";
    return res.status(Status.OK).json(response);
  },
};
