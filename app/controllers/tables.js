module.exports = function (app, io) {
    var Table = require('../models/table');

    var tableSocket = io.of('/tables')
        .on('connection', function (socket) {
            socket.on('seatTaken', function (data) {
                tableSocket.emit('seatTaken', data);
            });

            socket.on('seatLeft', function (data) {
                tableSocket.emit('seatLeft', data);
            });
        });
}
