const chatService = require('../helpers/chat')
const msgService = require('../helpers/message');
const { resolve } = require('path');
const { reject } = require('lodash');

module.exports = {
    send_Message: ({ srcId, destId, chatid, msg, isGroup, ext }) => {
        return new Promise(async (resolve, reject) => {
            let participates;
            let group;
            let combinedSafetyNumber;
            let query;
            let data;
            if (typeof destId != 'string' && destId.length > 0) {
                participates = destId;
                group = isGroup || true;
            } else {
                participates = [destId, srcId];
                group = isGroup || false;

                // here is some error..
                let usr1 = await Users.findOne({ id: destId, select: ['safetyNumber'] });
                let usr2 = await Users.findOne({ id: srcId, select: ['safetyNumber'] });

                combinedSafetyNumber = await usr1.safetyNumber + usr2.safetyNumber;
                console.log("combined SafetyNumber", combinedSafetyNumber);

                if (destId != undefined && srcId != undefined) {
                    query = { 'participatesArray': { "$all": participates }, isGroup: group };
                    let projection = { select: ['fullName', 'profilePic'] };

                    chatService.findOne(query, projection).then(async (chatdetails) => {
                        data = {
                            message: msg,
                            destinationUserId: destId,
                            sourceUserId: srcId,
                            chatId: chatid,
                            created_by: srcId,
                            seenFlag: false,
                            isActive: true,
                            isDelete: false,
                        };
                        msgService.createOne(data).then((newMessage) => {

                            let query = {
                                id: newMessage.id
                            };

                            msgService.findOne(query).then((nm) => {
                                if (ext) {
                                    let contectType;
                                    switch (ext) {
                                        case 'jpg' || 'png' || 'jpeg' || 'gif':
                                            contectType = 'image'
                                            break;

                                        case 'png':
                                            contectType = 'image'
                                            break;

                                        case 'jpeg':
                                            contectType = 'image'
                                            break;

                                        case 'gif':
                                            contectType = 'image'
                                            break;

                                        default:
                                            contectType = 'other'
                                            break;
                                    }
                                    let data = {
                                        media: contectType
                                    };
                                    msgService.findAndUpdate(query, data).then((response) => {
                                        if (!response) {
                                            return reject("Something is missing");
                                        } else {
                                            return resolve(response);
                                        }
                                    });
                                }
                            });
                        });
                    });
                }
            }
        });
    },
}
