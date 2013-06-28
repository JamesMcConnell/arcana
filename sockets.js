module.exports = function (app, io) {
    var chat = io
        .of('/chat')
        .on('connection', function (socket) {
            socket.on('message', function (data) {
                socket.emit('updateChat', data);
                socket.broadcast.to(socket.room).emit('updateChat', data);
                //io.sockets.in(socket.room).emit('updateChat', data);
            });

            socket.on('userEntered', function (data) {
                socket.room = data.roomName;
                socket.username = data.username;
                socket.join(data.roomName);
                socket.emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: 'You have connected to ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
                socket.broadcast.to(data.roomName).emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: data.username + ' has entered ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
            });

            socket.on('switchRoom', function (data) {
                socket.leave(socket.room);
                socket.join(data.roomName);
                socket.emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: 'You have connected to ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
                // notify old room
                socket.broadcast.to(socket.room).emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: data.username + ' has left the room',
                    timestamp: new Date().getTime()
                });
                socket.room = data.roomName;
                socket.broadcast.to(data.roomName).emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: data.username + ' has entered ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
            });

            socket.on('disconnect', function () {
                socket.broadcast.emit('updateChat',{
                    serverGenerated: true,
                    user: socket.username,
                    body: socket.username + ' has left the room.',
                    timestamp: new Date().getTime()
                });
            });
        });

    var lobby = io
        .of('/lobby')
        .on('connection', function (socket) {
            socket.on('playerChangedSeat', function (data) {
                socket.broadcast.emit('updateTable', data);
            });
        });
};