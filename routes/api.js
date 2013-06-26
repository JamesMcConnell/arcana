var userDb = require('../data/user');
var roomDb = require('../data/room');

module.exports = {
    /** User API **/
    getUsers: function (req, res) {
        userDb.getPagedUsers(req.param('currentPage'), req.param('numPerPage'), function (err, reply, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: reply, message: null });
            }
        });
    },
    getUser: function (req, res) {
        userDb.getUser(req.param('userId'), function (err, user, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: user, message: null });
            }
        });
    },
    postUser: function (req, res) {
        userDb.saveUser({
            username: req.param('username'),
            email: req.param('email'),
            isAdmin: req.param('isAdmin'),
            password: req.param('password')
        }, function (err, user, info) {
            if (err) {
                return res.json(200, { success: false, user: null, message: info.message });
            } else {
                return res.json(200, { success: true, user: user, message: null });
            }
        });
    },
    putUser: function (req, res) {
        var uid = req.param('userId');
        var userObj = {
            username: req.body.username,
            email: req.body.email,
            isAdmin: req.body.isAdmin
        };
        userDb.updateUser(uid, userObj, function (err, message) {
            if (err) {
                res.json(200, { success: false, message: message });
            } else {
                res.json(200, { success: true, message: '' });
            }
        });
    },
    /** Room API **/
    getRooms: function (req, res) {
        roomDb.getPagedRooms(req.param('currentPage'), req.param('numPerPage'), function (err, reply, info) {
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
                res.json(200, { success: false, message: message });
            } else {
                res.json(200, { success: true, message: '' });
            }
        });
    }
};

