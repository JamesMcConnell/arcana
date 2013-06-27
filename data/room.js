var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Room = require('../models/room');

module.exports = {
    saveRoom: function (roomInfo, callback) {
        var newRoom = new Room({
            roomName: roomInfo.roomName,
            numPlayers: roomInfo.numPlayers
        });

        newRoom.save(function (err) {
            if (err) {
                if (err.code === 11000) {
                    callback(true, null, { message: 'Duplicate room name' });
                }
            } else {
                callback(null, newRoom, null);
            }
        });
    },
    updateRoom: function (roomId, room, callback) {
        Room.findOneAndUpdate({ _id: roomId }, room, function (err) {
            if (err) {
                callback(true, err);
            } else {
                callback(false, '');
            }
        });
    },
    getRooms: function (isPaged, currentPage, numPerPage, callback) {
        if (!isPaged) {
            Room.find().sort('numPlayers').exec(function (err, roomList) {
                if (err) {
                    return callback(true, null, { message: 'Unable to retrieve rooms' });
                }
                var reply = {
                    rooms: roomList
                };
                callback(false, reply, null);
            });
        } else {
            var count = 0;
            var roomList = [];
            var pages = 1;
            var skip = (currentPage - 1) * numPerPage;

            var countQuery = Room.find().count();
            countQuery.exec(function (err, num) {
                count = num;
                if (count > 1) {
                    pages = Math.ceil(count / numPerPage);
                }

                var listQuery = Room.find().sort('numPlayers').skip(skip).limit(numPerPage);
                listQuery.exec(function (err, roomList) {
                    if (err) {
                        return callback(true, null, { message: 'Unable to retrieve rooms' });
                    }

                    var reply = {
                        currentPage: currentPage,
                        pages: pages,
                        rooms: roomList
                    };
                    callback(false, reply, null);
                });
            });
        }
    },
    getRoom: function (roomId, callback) {
        Room.findById(roomId).exec(function (err, room) {
            if (err) {
                return callback(true, null, { message: 'Unable to retrieve room' });
            }
            callback(false, room, null);
        });
    }
};