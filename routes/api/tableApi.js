var tableDb = require('../../data/table');

module.exports = {
    getTables: function (req, res) {
        tableDb.getTables(req.param('isPaged'), req.param('currentPage'), req.param('numPerPage'), req.param('roomName'), function (err, reply, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: reply, message: null });
            }
        });
    },
    getTable: function (req, res) {
        tableDb.getTable(req.param('tableId'), function (err, table, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: table, message: null });
            }
        });
    },
    postTable: function (req, res) {
        tableDb.saveTable({
            tableName: req.param('tableName'),
            roomName: req.param('roomName'),
            players: req.param('players'),
            status: req.param('status')
        }, function (err, table, info) {
            if (err) {
                return res.json(200, { success: false, table: null, message: info.message });
            } else {
                return res.json(200, { success: true, table: table, message: null });
            }
        });
    },
    putTable: function (req, res) {
        var tableId = req.param('tableId');
        var tableObj = {
            tableName: req.body.tableName,
            roomName: req.body.roomName,
            players: req.body.players,
            status: req.body.status
        };
        tableDb.updateTable(tableId, tableObj, function (err, message) {
            if (err) {
                return res.json(200, { success: false, message: message });
            } else {
                return res.json(200, { success: true, message: '' });
            }
        });
    }
};