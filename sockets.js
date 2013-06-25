module.exports = function (app, io) {
    var chat = io
        .of('/lobby')
        .on('connection', function (socket) {
            socket.on('message', function (data) {
                chat.emit('message', data);
            });
        });
};