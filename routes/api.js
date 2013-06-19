var db = require('../config/db-config');

module.exports = {
    getUsers: function (req, res) {
        db.getPagedUsers(req.param('currentPage'), req.param('numPerPage'), function (err, reply, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: reply, message: null });
            }
        });
    },
    getUser: function (req, res) {
        db.getUser(req.param('userId'), function (err, user, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: user, message: null });
            }
        });
    },
    postUser: function (req, res) {
        db.saveUser({
            username: req.param('username'),
            password: req.param('password'),
            email: req.param('email')
        }, function (err, user, info) {
            if (err) {
                return res.json(200, { success: false, user: null, message: info.message });
            } else {
                return res.json(200, { success: true, user: user, message: null });
            }
        });
    },
    putUser: function (req, res) {
        db.updateUser(req.param('uid'), req.param('user'), function (err, message) {
            if (err) {
                res.json(200, { success: false, message: message });
            } else {
                res.json(200, { success: true, message: '' });
            }
        });
    }
};
