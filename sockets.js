module.exports = function (app, io) {
    var chat = io
        .of('/chat')
        .on('connection', function (socket) {
            // User enters message in chat
            socket.on('message', function (data) {
                socket.broadcast.to(socket.room).emit('updateChat', data);
            });

            // User has entered a room
            socket.on('userEntered', function (data) {
                socket.room = data.roomName; // set room on socket
                socket.username = data.username; // set username on socket
                socket.join(data.roomName); // join the room
                // Send chat message back for user
                socket.emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: 'You have connected to ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
                // Send chat message back for everyone else
                socket.broadcast.to(data.roomName).emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: data.username + ' has entered ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
            });

            // User has changed rooms
            socket.on('switchRoom', function (data) {
                socket.leave(socket.room); // leave the old room
                socket.join(data.roomName); // join the new room
                socket.username = data.username;
                // Send chat message for user
                socket.emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: 'You have connected to ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
                // Send chat message for old room
                socket.broadcast.to(socket.room).emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: data.username + ' has left the room',
                    timestamp: new Date().getTime()
                });
                socket.room = data.roomName; // set the room on the socket
                // Send chat message for everyone else
                socket.broadcast.to(data.roomName).emit('updateChat', {
                    serverGenerated: true,
                    user: data.username,
                    body: data.username + ' has entered ' + data.roomName + '.',
                    timestamp: new Date().getTime()
                });
            });

            // User has disconnected from room
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