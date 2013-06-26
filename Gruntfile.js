var dbConfig = require('./config/db-config');
var userDb = require('./data/user');
var roomDb = require('./data/room');

module.exports = function (grunt) {
    /*
    grunt.registerTask('dbseed', 'seed the database', function () {
        grunt.task.run('adduser:admin:admin@arcana.com:jm71cl33:true');
        grunt.task.run('adduser:interneth3ro:interneth3ro@arcana.com:jm71cl33:false');
    });
    */

    grunt.registerTask('roomSeed', 'seed initial rooms', function () {
        var room1 = {
            roomName: 'Room 1',
            numPlayers: 2
        };
        console.log(room1);

        var room2 = {
            roomName: 'Room 2',
            numPlayers: 3
        };
        console.log(room2);

        var room3 = {
            roomName: 'Room 3',
            numPlayers: 4
        };
        console.log(room3);

        var room4 = {
            roomName: 'Room 4',
            numPlayers: 6
        };
        console.log(room4);

        dbConfig.startup('mongodb://localhost/arcana');

        roomDb.saveRoom(room1, function (err, room, info) {
            if (err) {
                console.log(info.message);
            } else {
                console.log('Created room: ' + room.roomName);
            }
        });

        roomDb.saveRoom(room2, function (err, room, info) {
            if (err) {
                console.log(info.message);
            } else {
                console.log('Created room: ' + room.roomName);
            }
        });

        roomDb.saveRoom(room3, function (err, room, info) {
            if (err) {
                console.log(info.message);
            } else {
                console.log('Created room: ' + room.roomName);
            }
        });

        roomDb.saveRoom(room4, function (err, room, info) {
            if (err) {
                console.log(info.message);
            } else {
                console.log('Created room: ' + room.roomName);
            }
        });
    });

    grunt.registerTask('adduser', 'add a user to the database', function (user, emailAddress, password, admin) {
        admin = (admin === "true");
        var user = new User({
            username: user,
            email: emailAddress,
            password: password,
            isAdmin: admin
        });

        var done = this.async();
        user.save(function (err) {
            if (err) {
                console.log('Error: ' + err);
                done(false);
            } else {
                console.log('Created user: ' + user.username);
                done();
            }
        });
    });
}

