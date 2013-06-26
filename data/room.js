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
            console.log('db task executed');
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
    getPagedRooms: function (currentPage, numPerPage, callback) {
        var count = 0;
        var roomList = [];
        var pages = 1;
        var skip = (currentPage -1 ) * numPerPage;

        Room.find().count().exec(function (err, num) {
            count = num;
            if (count > 1) {
                pages = Math.ceil(count / numPerPage);
            }

            Room.find()
                .sort('roomName')
                .skip(skip)
                .limit(numPerPage)
                .exec(function (err, roomList) {
                    if (err) {
                        callback(true, null, { message: 'Unable to retrieve rooms' });
                    }
                    var reply = {
                        currentPage: currentPage,
                        pages: pages,
                        rooms: roomList
                    };

                    callback(false, reply, null);
                });
        });
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