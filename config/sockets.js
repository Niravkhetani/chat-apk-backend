/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * Use the settings below to configure realtime functionality in your app.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For all available options, see:
 * https://sailsjs.com/config/sockets
 */

const SOCKET = [];

module.exports.sockets = {
  /***************************************************************************
   *                                                                          *
   * `transports`                                                             *
   *                                                                          *
   * The protocols or "transports" that socket clients are permitted to       *
   * use when connecting and communicating with this Sails application.       *
   *                                                                          *
   * > Never change this here without also configuring `io.sails.transports`  *
   * > in your client-side code.  If the client and the server are not using  *
   * > the same array of transports, sockets will not work properly.          *
   * >                                                                        *
   * > For more info, see:                                                    *
   * > https://sailsjs.com/docs/reference/web-sockets/socket-client           *
   *                                                                          *
   ***************************************************************************/

  // transports: ['websocket'],
  // onlyAllowOrigins: ['*'],
  /***************************************************************************
   *                                                                          *
   * `beforeConnect`                                                          *
   *                                                                          *
   * This custom beforeConnect function will be run each time BEFORE a new    *
   * socket is allowed to connect, when the initial socket.io handshake is    *
   * performed with the server.                                               *
   *                                                                          *
   * https://sailsjs.com/config/sockets#?beforeconnect                        *
   *                                                                          *
   ***************************************************************************/

  beforeConnect: function (handshake, proceed) {
    // `true` allows the socket to connect.
    // (`false` would reject the connection)
    // console.log("before.... socket called!!");
    return proceed(undefined, true);
  },

  onConnect: function (session, socket) {
    // console.log("Yo ho! socket is connected: ", socket);
    // console.log("socket : ", socket);
    sails.sockets.blast("SocketId", {socketid: socket.id});
    sails.sockets.broadcast(socket.id, "SocketId", {socketid: socket.id});

    // console.log("value of data", data1)/;
    // By default: do nothing
  },
  /***************************************************************************
   *                                                                          *
   * `afterDisconnect`                                                        *
   *                                                                          *
   * This custom afterDisconnect function will be run each time a socket      *
   * disconnects                                                              *
   *                                                                          *
   ***************************************************************************/

  //   afterDisconnect: async function (session, socket, done) {
  //     // By default: do nothing.
  //     // (but always trigger the callback)
  //     console.log("afterDisconnect rooms : ", sails.rooms);
  //     console.log("session after disconnect : ", session);

  //     // var userId = sails.rooms.values(socket.id);

  //     // var key = Object.keys(sails.rooms).find(
  //     //   (key) => sails.rooms[key] === socket.id
  //     // );
  //     // console.log("key : ", key);
  //     let index = -1;
  //     let key;
  //     sails.rooms.map((room, i) => {
  //       console.log("room", room, i);
  //       key = Object.keys(room).find((key) => {
  //         if (room[key] === socket.id) {
  //           return true;
  //         }
  //       });
  //       if (key) {
  //         index = i;
  //       }
  //     });

  //     console.log("Key find at : ", key, index);
  //     if (index >= 0) {
  //       let getUser = await Users.updateOne({
  //         id: Object.keys(sails.rooms[index])[0],
  //       }).set({
  //         lastSeenTime: sails.rooms[index].updatedAt,
  //       });

  //       sails.rooms.splice(index, 1);
  //       // delete sails.rooms[index];

  //       // eventName, data
  //       sails.sockets.blast("userUpdated", "User is updated");
  //       sails.sockets.blast("userOffline", getUser);
  //     }

  //     console.log("after delete : ", sails.rooms);

  //     console.log("socket is disconnected!!!", socket.id);
  //     return done();
  //   },

  /***************************************************************************
   *                                                                          *
   * Whether to expose a 'GET /__getcookie' route that sets an HTTP-only      *
   * session cookie.                                                          *
   *                                                                          *
   ***************************************************************************/
  onDisconnect: async function (session, socket, done) {
    // By default: do nothing.
    // (but always trigger the callback)
    console.log("afterDisconnect rooms : ", sails.rooms);
    console.log("session after disconnect : ", session);

    // var userId = sails.rooms.values(socket.id);

    // var key = Object.keys(sails.rooms).find(
    //   (key) => sails.rooms[key] === socket.id
    // );
    // console.log("key : ", key);
    let index = -1, key;
    sails.rooms.map((room, i) => {
      key = Object.keys(room).find((key) => {
        if (room[key] === socket.id) {
          return true;
        }
      });
      if (key) {
        index = i;
      }
    });

    console.log("Key find at : ", key, index);
    if (index >= 0) {
      let getUser = await Users.updateOne({
        id: Object.keys(sails.rooms[index])[0],
      }).set({
        lastSeenTime: sails.rooms[index].updatedAt,
      });

      sails.rooms.splice(index, 1);
      // delete sails.rooms[index];

      // eventName, data
      sails.sockets.blast("userUpdated", "User is updated");
      sails.sockets.blast("userOffline", getUser);
    }

    console.log("after delete : ", sails.rooms);

    console.log("socket is disconnected!!!", socket.id);
    // return done(); // return done();
  },
  // grant3rdPartyCookie: true,
};
