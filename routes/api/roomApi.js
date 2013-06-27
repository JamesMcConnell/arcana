var roomDb = require('../../data/room');

module.exports = {
    getRooms: function (req, res) {
        roomDb.getRooms(req.param('isPaged'), req.param('currentPage'), req.param('numPerPage'), function (err, reply, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: reply, message: null });
            }
        });
    },
    getRoom: function (req, res) {
        roomDb.getRoom(req.param('roomId'), function (err, room, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: room, message: null });
            }
        });
    },
    postRoom: function (req, res) {
        roomDb.saveRoom({
            roomName: req.param('roomName'),
            numPlayers: req.param('numPlayers')
        }, function (err, room, info) {
            if (err) {
                return res.json(200, { success: false, room: null, message: info.message });
            } else {
                return res.json(200, { success: true, room: room, message: null });
            }
        });
    },
    putRoom: function (req, res) {
        var roomId = req.param('roomId');
        var roomObj = {
            roomName: req.body.roomName,
            numPlayers: req.body.numPlayers
        };
        roomDb.updateRoom(roomId, roomObj, function (err, message) {
            if (err) {
                return res.json(200, { success: false, message: message });
            } else {
                return res.json(200, { success: true, message: '' });
            }
        });
    }
};