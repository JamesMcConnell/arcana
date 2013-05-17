module.exports = function (app, io) {
    var Chat = require('../models/chat');

    var chat = io
        .of('/lobby')
        .on('connection', function (socket) {
            getLog(socket);

            socket.on('message', function (data) {
                msg = new Chat(data);
                msg.save();
                chat.emit('message', data);
            });
        });

    function getLog(socket) {
        var age = new Date().getTime() - 1800000;
        Chat.find()
            .where('timestamp')
            .gte(age)
            .sort('timestamp')
            .exec(function (err, result) {
                if (err) {
                    console.log(err);
                }

                socket.emit('init', result);
            });
    }
}
