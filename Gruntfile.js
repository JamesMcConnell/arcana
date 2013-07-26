var dbConfig = require('./config/db-config');
var userModel = require('./models/user');
var roomModel = require('./models/room');
var tableModel = require('./models/table');

module.exports = function (grunt) {
    grunt.registerTask('roomSeed', 'seed initial rooms', function () {
        var Randland = new roomModel({
            roomName: 'Randland',
            numPlayers: 2
        });

        var Westeros = new roomModel({
            roomName: 'Westeros',
            numPlayers: 3
        });

        var Shadowmarch = new roomModel({
            roomName: 'Shadowmarch',
            numPlayers: 4
        });

        var MiddleEarth = new roomModel({
            roomName: 'Middle-Earth',
            numPlayers: 6
        });

        dbConfig.startup('mongodb://localhost/arcana');
        var done = this.async();

        Randland.save(function (err) {
            if (err) {
                console.log('error occurred');
                done(false);
            } else {
                console.log(Randland.roomName + ' added successfully');
                done();
            }
        });

        Westeros.save(function (err) {
            if (err) {
                console.log('error occurred');
                done(false);
            } else {
                console.log(Westeros.roomName + ' added successfully');
                done();
            }
        });

        Shadowmarch.save(function (err) {
            if (err) {
                console.log('error occurred');
                done(false);
            } else {
                console.log(Shadowmarch.roomName + ' added successfully');
                done();
            }
        });

        MiddleEarth.save(function (err) {
            if (err) {
                console.log('error occurred');
                done(false);
            } else {
                console.log(MiddleEarth.roomName + ' added successfully');
                done();
            }
        });
    });

    grunt.registerTask('tableSeed', 'seed tables', function () {
        dbConfig.startup('mongodb://localhost/arcana');
        var done = this.async();

        var rooms = [{
            roomName: 'Randland',
            numPlayers: 2
        },{
            roomName: 'Westeros',
            numPlayers: 3
        },{
            roomName: 'Shadowmarch',
            numPlayers: 4
        },{
            roomName: 'Middle-Earth',
            numPlayers: 6
        }];

        for (var roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
            var room = rooms[roomIndex];
            var tableNames = [];

            switch (room.roomName) {
                case 'Randland':
                    tableNames = ["Altara","Amadicia","Andor","Arad Doman","Arafel","Kandor","Malkier","Saldaea","Shienar","Cairhien","Ghealdan","Illian","Murandy","Tarabon","Tear","Haven"];
                    break;
                case 'Westeros':
                    tableNames = ["Winterfell","Pyke","Harrenhal","Riverrun","The Twins","Casterly Rock","Lannisport","Oldtown","Storm's End","Dragonstone","King's Landing","The Wall","The Eyrie","Dorne","Braavos","Haven"];
                    break;
                case 'Shadowmarch':
                    tableNames = ["Twilight Lands","Vuttish","Connord","Southmarch","Brenland","Settland","Perikal","Syan","Fael","Krace","Ulos","Akaris","Hierosol","Devonis","Xand","Haven"];
                    break;
                case 'Middle-Earth':
                    tableNames = ["Arnor","Bree-land","Erebor","Esgaroth","Fangorn","Gondor","Helm's Deep","Isengard","Khazad-dum","Lothlorien","Mordor","Mirkwood","Rivendell","Rohan","The Shire","Haven"];
            }

            for (var tableIndex = 0; tableIndex < tableNames.length; tableIndex++) {
                var tableName = tableNames[tableIndex];

                var table = new tableModel({
                    tableName: tableName,
                    roomName: room.roomName,
                    status: 'Open',
                    seats: [],
                    leader: ''
                });

                for (var pos = 1; pos <= room.numPlayers; pos++) {
                    table.seats.push({
                        username: '',
                        position: pos,
                        isLeader: false
                    });
                }

                table.save(function (err) {
                    if (err) {
                        console.log('error occurred');
                        done(false);
                    } else {
                        console.log(table.tableName + ' added successfully');
                        done();
                    }
                });
            }
        }
    });

    grunt.registerTask('userSeed', 'add a user to the database', function () {
        dbConfig.startup('mongodb://localhost/arcana');
        var done = this.async();

        var interneth3roUser = new userModel({
            username: 'interneth3ro',
            email: 'interneth3ro@arcana.com',
            password: 'jm71cl33',
            isAdmin: true
        });

        var adminUser = new userModel({
            username: 'admin',
            email: 'admin@arcana.com',
            password: 'jm71cl33',
            isAdmin: true
        });

        interneth3roUser.save(function (err) {
            if (err) {
                console.log('error occurred');
            } else {
                console.log(interneth3roUser.username + ' added successfully');
            }

            done();
        });

        adminUser.save(function (err) {
            if (err) {
                console.log('error occurred');
            } else {
                console.log(adminUser.username + ' added successfully');
            }

            done();
        });
    });
};

