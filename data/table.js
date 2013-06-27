var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Table = require('../models/table');

module.exports = {
    saveTable: function (tableInfo, callback) {
        var newTable = new Table({
            tableName: tableInfo.tableName,
            roomName: tableInfo.roomName,
            players: tableInfo.players,
            status: tableInfo.status
        });

        newTable.save(function (err) {
            if (err) {
                if (err.code === 11000) {
                    callback(true, null, { message: 'Duplicate table name' });
                }
            } else {
                callback(null, newTable, null);
            }
        });
    },
    updateTable: function (tableId, table, callback) {
        Table.findOneAndUpdate({ _id: tableId }, table, function (err) {
            if (err) {
                callback(true, err);
            } else {
                callback(false, '');
            }
        });
    },
    getTable: function (tableId, callback) {
        Table.findById(tableId).exec(function (err, table) {
            if (err) {
                return callback(true, null, { message: 'Unable to retrieve table' });
            }

            callback(false, table, null);
        });
    },
    getTables: function (isPaged, currentPage, numPerPage, roomName, callback) {
        if (!isPaged) {
            var tableQuery = Table.find().sort('tableName');
            if (roomName && roomName.length > 0) {
                tableQuery.where('roomName').equals(roomName);
            }
            tableQuery.exec(function (err, tableList) {
                if (err) {
                    return callback(true, null, { message: 'Unable to retrieve tables' });
                }
                var reply = {
                    tables: tableList
                };
                callback(false, reply, null);
            });
        } else {
            var count = 0;
            var tableList = [];
            var pages = 1;
            var skip = (currentPage - 1) * numPerPage;

            var countQuery = Table.find().count();
            if (roomName && roomName.length > 0) {
                countQuery.where('roomName').equals(roomName);
            }

            countQuery.exec(function (err, num) {
                count = num;
                if (count > 1) {
                    pages = Math.ceil(count / numPerPage);
                }

                var listQuery = Table.find().sort('tableName').skip(skip).limit(numPerPage);
                if (roomName && roomName.length > 0) {
                    listQuery.where('roomName').equals(roomName);
                }

                listQuery.exec(function (err, tableList) {
                    if (err) {
                        return callback(true, null, { message: 'Unable to retrieve tables' });
                    }
                    var reply = {
                        currentPage: currentPage,
                        pages: pages,
                        tables: tableList
                    };
                    callback(false, reply, null);
                });
            });
        }
    }
};