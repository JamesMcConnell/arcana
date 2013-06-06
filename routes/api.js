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
    }
};

