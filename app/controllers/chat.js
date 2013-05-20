module.exports = function (app, io) {
    var Chat = require('../models/chat');

    var lobbyChat = io.of('/lobbyChat')
        .on('connection', function (socket) {
            socket.on('message', function (data) {
                lobbyChat.emit('message', data);
            });
        });
}
