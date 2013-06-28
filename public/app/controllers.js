app.controller('MainController', function ($scope, $rootScope, $http, UserService) {
    UserService.me();

    $scope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };
});

app.controller('IndexController', function ($scope, $http, $rootScope) {
    /*
    $scope.test = function () {
        var username = $scope.$parent.currentUsername;
    }
    */
});

app.controller('NavbarController', function ($scope, $rootScope, UserService) {
    $scope.currentUsername = '';
    $scope.isLoggedIn = false;
    $scope.isAdmin = false;

    $rootScope.$on('currentUser', function () {
        var user = UserService.currentUser();
        if (user._id) {
            $scope.currentUsername = user.username;
            $scope.isLoggedIn = true;
            $scope.isAdmin = user.isAdmin;
        }
    });
});

app.controller('SidebarController', function ($scope, $rootScope, UserService) {
    $scope.currentUsername = '';
    $scope.isLoggedIn = false;
    $scope.isAdmin = false;

    $rootScope.$on('currentUser', function () {
        var user = UserService.currentUser();
        if (user._id) {
            $scope.currentName = user.username;
            $scope.isLoggedIn = true;
            $scope.isAdmin = user.isAdmin;
        }
    });
});

app.controller('ChatController', function ($scope, $rootScope, UserService) {
    $scope.chat = io.connect('/chat');
    $scope.chatMsg = '';
    $scope.chatLog = [];
    $scope.maxChatLogSize = 2000;
    $scope.currentUser = {};
    $scope.currentRoom = '';

    $scope.sendMsg = function () {
        if ($scope.chatMsg.length) {
            var data = {
                user: $scope.currentUser.username,
                body: $scope.chatMsg,
                serverGenerated: false,
                timestamp: new Date().getTime()
            };

            $scope.chat.emit('message', data);
            $scope.chatMsg = '';
        }
    };

    $scope.chat.on('updateChat', function (data) {
        $scope.chatLog.push(data);
        $scope.safeApply();
        $scope.cleanChat();
    });

    $scope.cleanChat = function () {
        if ($scope.chatLog.length > ($scope.maxChatLogSize - 1)) {
            $scope.chatLog.splice(0, ($scope.chatLog.length - ($scope.maxChatLogSize - 1)));
        }
    };

    $rootScope.$on('currentUser', function () {
        var user = UserService.currentUser();
        if (user._id) {
            $scope.currentUser.uid = user._id;
            $scope.currentUser.username = user.username;
            $scope.currentUser.isAdmin = user.isAdmin;
        }
    });

    $rootScope.$on('userEnteredRoom', function (scope, payload) {
        $scope.currentRoom = payload.roomName;

        $scope.chat.emit('userEntered', {
            roomName: $scope.currentRoom,
            username: $scope.currentUser.username
        });
    });

    $rootScope.$on('userChangedRoom', function (scope, payload) {
        $scope.currentRoom = payload.roomName;
        $scope.chat.emit('switchRoom', {
            roomName: $scope.currentRoom,
            username: payload.username
        });
    });
});

app.controller('LobbyController', function ($scope, $rootScope, UserService, RoomService, TableService) {
    $scope.currentUser = {};
    $scope.chat = io.connect('/lobby');
    $scope.rooms = [];
    $scope.tables = [];
    $scope.currentRoom = {};

    RoomService.getRooms(false, null, null, function (currentPage, pages, rooms) {
        $scope.rooms = rooms;
        $scope.currentRoom = angular.copy($scope.rooms[0]);
        $scope.numPlayers = $scope.currentRoom.numPlayers;
        $scope.getTables($scope.currentRoom.roomName);

        $rootScope.$broadcast('userEnteredRoom',{
            roomName: $scope.currentRoom.roomName
        });
    });

    $scope.clearLeftMargin = function (index) {
        if (index % 4 == 0) {
            return { 'margin-left': '0px' };
        }
    };

    $rootScope.$on('currentUser', function () {
        var user = UserService.currentUser();
        if (user._id) {
            $scope.currentUser.uid = user._id;
            $scope.currentUser.username = user.username;
            $scope.currentUser.isAdmin = user.isAdmin;
        }
    });

    $scope.getTables = function (roomName) {
        TableService.getTables(false, null, null, roomName, function (currentPage, pages, tables) {
            $scope.tables = tables;
        });
    };

    $scope.changeRoom = function (roomName) {
        $scope.currentRoom = angular.copy(_.find($scope.rooms, function (room) {
            return room.roomName == roomName;
        }));

        $scope.getTables($scope.currentRoom.roomName);

        $rootScope.$broadcast('userChangedRoom', {
            roomName: $scope.currentRoom.roomName,
            username: $scope.currentUser.username
        });
    };

    $scope.takeSeat = function (order, tableId, tableName) {
        var table = _.find($scope.tables, function (table) {
            return table.tableName == tableName;
        });

        table.players.push({
            username: $scope.currentUser.username,
            userId: $scope.currentUser.uid,
            order: order
        });

        TableService.updateTable(tableId, table, function (data) {});
        $scope.chat.emit('playerChangedSeat', {
            action: 'tookSeat',
            tableName: tableName,
            username: $scope.currentUser.username,
            userId: $scope.currentUser.uid,
            order: order
        });
    };

    $scope.chat.on('updateTable', function (data) {
        var table = _.find($scope.tables, function (table) {
            return table.tableName == data.tableName;
        });

        if (data.action == 'tookSeat') {
            table.players.push({
                username: data.username,
                userId: data.userId,
                order: data.order
            });
        } else {
            table.players = _.reject($scope.players, function (player) {
                return player.username == data.username;
            });

            if (table.players.length) {
                for (var i = 0; i < table.players.length; i++) {
                    table.players[i].order = i;
                }
            }
        }
    });

    $scope.leaveSeat = function (order, tableId, tableName) {
        var table = _.find($scope.tables, function (table) {
            return table.tableName == tableName;
        });

        table.players = _.reject($scope.players, function (player) {
            return player.username == $scope.currentUser.username;
        });

        if (table.players.length) {
            // re-order positions
            for (var i = 0; i < table.players.length; i++) {
                table.players[i].order = i;
                TableService.updateTable(table._id, table, function (data) {});
            }
        }

        $scope.chat.emit('playerChangedSeat', {
            action: 'leftSeat',
            tableName: tableName,
            username: $scope.currentUser.username,
            userId: $scope.currentUser.uid,
            order: order
        });
    };

    $scope.playerInSeat = function (order, tableName) {
        var table = _.find($scope.tables, function (table) {
            return table.tableName == tableName;
        });

        if (!table.players.length) {
            return false;
        }

        return (table.players[order]);
    };

    $scope.getSeatText = function (order, tableName) {
        var table = _.find($scope.tables, function (table) {
            return table.tableName == tableName;
        });

        if (table.players.length && table.players.length >= order) {
            return (table.players[order].username == $scope.currentUser.username) ? 'Leave Seat' : table.players[order].username;
        }

        return 'Take Seat';
    }
});

app.controller('LoginController', function ($scope, $http, $rootScope, $window) {
    $scope.username = '';
    $scope.password = '';
    $scope.errorMessage = '';

    $scope.login = function () {
        $http.post('/login', { username: $scope.username, password: $scope.password }).success(function(data) {
            if (!data.success) {
                $scope.errorMessage = data.message;
            } else {
                $window.location.href = '/';
            }
        });
    };
});

app.controller('RegisterController', function ($scope, $http, $rootScope, $window) {
    $scope.username = '';
    $scope.password = '';
    $scope.confirmPassword = '';
    $scope.email = '';
    $scope.errorMessage = '';

    $scope.register = function () {
        $http.post('/register', { username: $scope.username, password: $scope.password, email: $scope.email }).success(function (data) {
            if (!data.success) {
                $scope.errorMessage = data.message;
            } else {
                $window.location.href = '/';
            }
        });
    };
});

app.controller('TableAdminController', function ($scope, $http, $dialog, TableService, RoomService, NotificationService) {
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.tables = [];
    $scope.rooms = [];
    $scope.selectedRoom = 'all';
    $scope.errorMessage = '';

    $scope.$watch('numPerPage', function () {
        $scope.getTables(1);
    });

    $scope.$watch('selectedRoom', function () {
        $scope.getTables(1);
    });

    /* Populate table data
    var tables = [{ tableName: "Altara",
        roomName: "Randland",
        status: "Open",
        players: [],
        _id:  "51cb9f6e627f71c013000002",
        "__v": 0 },
        { tableName: "Amadicia",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba075627f71c013000003",
            "__v": 0 },
        { tableName: "Andor",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba07e627f71c013000004",
            "__v": 0 },
        { tableName: "Arad Doman",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba087627f71c013000005",
            "__v": 0 },
        { tableName: "Arafel",
            roomName: "Randland",
            players: [],
            status: "Open",
            _id:  "51cba08f627f71c013000006",
            "__v": 0 },
        { tableName: "Kandor",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba096627f71c013000007",
            "__v": 0 },
        { tableName: "Malkier",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba09f627f71c013000008",
            "__v": 0 },
        { tableName: "Saldaea",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0aa627f71c013000009",
            "__v": 0 },
        { tableName: "Shienar",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0b7627f71c01300000a",
            "__v": 0 },
        { tableName: "Cairhien",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0c0627f71c01300000b",
            "__v": 0 },
        { tableName: "Ghealdan",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0cc627f71c01300000c",
            "__v": 0 },
        { tableName: "Illian",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0ec627f71c01300000d",
            "__v": 0 },
        { tableName: "Murandy",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0f4627f71c01300000e",
            "__v": 0 },
        { tableName: "Tarabon",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba0fc627f71c01300000f",
            "__v": 0 },
        { tableName: "Tear",
            roomName: "Randland",
            status: "Open",
            players: [],
            _id:  "51cba104627f71c013000010",
            "__v": 0 },
        { tableName: "Winterfell",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba6fb627f71c013000011",
            "__v": 0 },
        { tableName: "Pyke",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba702627f71c013000012",
            "__v": 0 },
        { tableName: "Harrenhal",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba70b627f71c013000013",
            "__v": 0 },
        { tableName: "Riverrun",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba712627f71c013000014",
            "__v": 0 },
        { tableName: "The Twins",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba719627f71c013000015",
            "__v": 0 },
        { tableName: "Casterly Rock",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba724627f71c013000016",
            "__v": 0 },
        { tableName: "Lannisport",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba72e627f71c013000017",
            "__v": 0 },
        { tableName: "Oldtown",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba736627f71c013000018",
            "__v": 0 },
        { tableName: "Storm's End",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba73e627f71c013000019",
            "__v": 0 },
        { tableName: "Dragonstone",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba74a627f71c01300001a",
            "__v": 0 },
        { tableName: "King's Landing",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba757627f71c01300001b",
            "__v": 0 },
        { tableName: "The Wall",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba760627f71c01300001c",
            "__v": 0 },
        { tableName: "The Eyrie",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba767627f71c01300001d",
            "__v": 0 },
        { tableName: "Dorne",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba770627f71c01300001e",
            "__v": 0 },
        { tableName: "Braavos",
            roomName: "Westeros",
            status: "Open",
            players: [],
            _id:  "51cba778627f71c01300001f",
            "__v": 0 },
        { tableName: "Twilight Lands",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba783627f71c013000020",
            "__v": 0 },
        { tableName: "Vuttish",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba78a627f71c013000021",
            "__v": 0 },
        { tableName: "Connord",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba791627f71c013000022",
            "__v": 0 },
        { tableName: "Southmarch",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba79b627f71c013000023",
            "__v": 0 },
        { tableName: "Brenland",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7a1627f71c013000024",
            "__v": 0 },
        { tableName: "Settland",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7aa627f71c013000025",
            "__v": 0 },
        { tableName: "Perikal",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7c4627f71c013000026",
            "__v": 0 },
        { tableName: "Syan",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7cc627f71c013000027",
            "__v": 0 },
        { tableName: "Fael",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7d4627f71c013000028",
            "__v": 0 },
        { tableName: "Krace",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7dc627f71c013000029",
            "__v": 0 },
        { tableName: "Ulos",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7e3627f71c01300002a",
            "__v": 0 },
        { tableName: "Akaris",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7ef627f71c01300002b",
            "__v": 0 },
        { tableName: "Hierosol",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba7f7627f71c01300002c",
            "__v": 0 },
        { tableName: "Devonis",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba800627f71c01300002d",
            "__v": 0 },
        { tableName: "Xand",
            roomName: "Shadowmarch",
            status: "Open",
            players: [],
            _id:  "51cba806627f71c01300002e",
            "__v": 0 },
        { tableName: "Arnor",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba816627f71c01300002f",
            "__v": 0 },
        { tableName: "Bree-land",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba820627f71c013000030",
            "__v": 0 },
        { tableName: "Erebor",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba826627f71c013000031",
            "__v": 0 },
        { tableName: "Esgaroth",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba82d627f71c013000032",
            "__v": 0 },
        { tableName: "Fangorn",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba836627f71c013000033",
            "__v": 0 },
        { tableName: "Gondor",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba842627f71c013000034",
            "__v": 0 },
        { tableName: "Helm's Deep",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba849627f71c013000035",
            "__v": 0 },
        { tableName: "Isengard",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba852627f71c013000036",
            "__v": 0 },
        { tableName: "Khazad-dum",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba85a627f71c013000037",
            "__v": 0 },
        { tableName: "Lothlorien",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba861627f71c013000038",
            "__v": 0 },
        { tableName: "Mordor",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba86b627f71c013000039",
            "__v": 0 },
        { tableName: "Mirkwood",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba872627f71c01300003a",
            "__v": 0 },
        { tableName: "Rivendell",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba879627f71c01300003b",
            "__v": 0 },
        { tableName: "Rohan",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba87f627f71c01300003c",
            "__v": 0 },
        { tableName: "The Shire",
            roomName: "Middle-Earth",
            status: "Open",
            players: [],
            _id:  "51cba887627f71c01300003d",
            "__v": 0 } ];

    $scope.populateTables = function () {
        angular.forEach(tables, function (table) {
            TableService.addTable(table, function (data) {});
        });
        $scope.getTables($scope.currentPage);
    };
    */

    $scope.getTables = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            var room = ($scope.selectedRoom == 'all') ? '' : $scope.selectedRoom;
            TableService.getTables(true, page, $scope.numPerPage, room, function (currentPage, pages, tables) {
                $scope.currentPage = currentPage;
                $scope.pages = pages;
                $scope.tables = tables;
            });
        }
    };

    $scope.getPreviousPage = function () {
        $scope.getTables(parseInt($scope.currentPage) - 1);
    };

    $scope.getNextPage = function () {
        $scope.getTables(parseInt($scope.currentPage) + 1);
    };

    $scope.addTable = function () {
        var dialog = $dialog.dialog({
            dialogFade: true,
            resolve: {
                item: function () {
                    return {
                        newTable: true,
                        table: null
                    };
                }
            }
        });

        dialog.open('/modals/addEditTableModal.html', 'TableEditModalController').then(function (status) {
            if (status) {
                NotificationService.success('Table successfully added!');
                $scope.getTables($scope.currentPage);
            }
        });
    };

    $scope.editTable = function (tableId) {
        TableService.getTable(tableId, function (data) {
            if (data.success) {
                var dialog = $dialog.dialog({
                    dialogFade: true,
                    resolve: {
                        item: function () {
                            return {
                                newTable: false,
                                table: angular.copy(data.result)
                            };
                        }
                    }
                });
                dialog.open('/modals/addEditTableModal.html', 'TableEditModalController').then(function (status) {
                    if (status) {
                        NotificationService.success('Table successfully updated!');
                        $scope.getTables($scope.currentPage);
                    }
                });
            } else {
                $scope.errorMessage = data.message;
            }
        });
    };

    $scope.getTables($scope.currentPage);
    RoomService.getRooms(false, null, null, function (currentPage, pages, rooms) {
        $scope.rooms = rooms;
    });
});

app.controller('RoomAdminController', function ($scope, $http, $dialog, RoomService, NotificationService) {
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.rooms = [];
    $scope.errorMessage = '';

    $scope.$watch('numPerPage', function () {
        $scope.getRooms(1);
    });

    /* Populate room data
    var rooms = [{
        roomName: "Randland",
        numPlayers: 2,
        _id: "51cb972609ed917c01000002",
        __v: 0
    },{
        roomName: "Westeros",
        numPlayers: 3,
        _id: "51cb972f09ed917c01000003",
        __v: 0
    },{
        roomName: "Shadowmarch",
        numPlayers: 4,
        _id: "51cb973a09ed917c01000004",
        __v: 0
    },{
        roomName: "Middle-Earth",
        numPlayers: 6,
        _id: "51cb974409ed917c01000005",
        __v: 0
    }];

    $scope.populateRooms = function () {
        angular.forEach(rooms, function (room) {
            RoomService.addRoom(room, function (data) {});
        });
        $scope.getRooms($scope.currentPage);
    };
    */

    $scope.getRooms = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            RoomService.getRooms(true, page, $scope.numPerPage, function (currentPage, pages, rooms) {
                $scope.currentPage = currentPage;
                $scope.pages = pages;
                $scope.rooms = rooms;
            });
        }
    };

    $scope.getPreviousPage = function () {
        $scope.getRooms(parseInt($scope.currentPage) - 1);
    };

    $scope.getNextPage = function () {
        $scope.getRooms(parseInt($scope.currentPage) + 1);
    };

    $scope.addRoom = function () {
        var dialog = $dialog.dialog({
            dialogFade: true,
            resolve: {
                item: function () {
                    return {
                        newRoom: true,
                        room: null
                    };
                }
            }
        });

        dialog.open('/modals/addEditRoomModal.html', 'RoomEditModalController').then(function (status) {
            if (status) {
                NotificationService.success('Room successfully added!');
                $scope.getRooms($scope.currentPage);
            }
        });

    };

    $scope.editRoom = function (roomId) {
        RoomService.getRoom(roomId, function (data) {
            if (data.success) {
                var dialog = $dialog.dialog({
                    dialogFade: true,
                    resolve: {
                        item: function () {
                            return {
                                newRoom: false,
                                room: angular.copy(data.result)
                            };
                        }
                    }
                });
                dialog.open('/modals/addEditRoomModal.html', 'RoomEditModalController').then(function (status) {
                    if (status) {
                        NotificationService.success('Room successfully updated!');
                        $scope.getRooms($scope.currentPage);
                    }
                });
            } else {
                $scope.alertMessage = data.message;
            }
        });
    };

    $scope.getRooms($scope.currentPage);
});

app.controller('UserAdminController', function ($scope, $http, $dialog, UserService, NotificationService) {
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.users = [];
    $scope.errorMessage = '';

    $scope.$watch('numPerPage', function () {
        $scope.getUsers(1);
    });

    $scope.getUsers = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            UserService.getUsers(true, $scope.currentPage, $scope.numPerPage, function (currentPage, pages, users) {
                $scope.currentPage = currentPage;
                $scope.pages = pages;
                $scope.users = users;
            });
        }
    };

    $scope.getPreviousPage = function () {
        $scope.getUsers(parseInt($scope.currentPage) - 1);
    };

    $scope.getNextPage = function () {
        $scope.getUsers(parseInt($scope.currentPage) + 1);
    };

    $scope.removeUser = function (id) {
        $http({ method: 'DELETE', url: '/users/' + id }).success(function (data) {
            if (data.status == 'error') {
                // messaging
            } else {
                // messaging
                $scope.getUsers($scope.currentPage);
            }
        });
    };

    $scope.addUser = function () {
        var dialog = $dialog.dialog({
            dialogFade: true,
            resolve: {
                item: function () {
                    return {
                        newUser: true,
                        user: null
                    };
                }
            }
        });
        dialog.open('/modals/addEditUserModal.html', 'UserEditModalController').then(function (status) {
            if (status) {
                NotificationService.success('User successfully added!');
                $scope.getUsers($scope.currentPage);
            }
        });
    };

    $scope.editUser = function (id) {
        UserService.getUser(id, function (payload) {
            if (payload.success) {
                var dialog = $dialog.dialog({
                    dialogFade: true,
                    resolve: {
                        item: function () {
                            return {
                                newUser: false,
                                user: angular.copy(payload.result)
                            };
                        }
                    }
                });
                dialog.open('/modals/addEditUserModal.html', 'UserEditModalController').then(function (status) {
                    if (status) {
                        NotificationService.success('User successfully updated!');
                        $scope.getUsers($scope.currentPage);
                    }
                });
            } else {
                $scope.alertMessage = payload.message;
            }
        });
    };

    $scope.getUsers($scope.currentPage);
});

app.controller('TableEditModalController', ['$scope', '$rootScope', 'RoomService', 'TableService', 'dialog', 'item', function ($scope, $rootScope, RoomService, TableService, dialog, item) {
    $scope.newTable = item.newTable;
    $scope.tableId = (!item.newTable) ? item.table._id : '';
    $scope.tableName = (!item.newTable) ? item.table.tableName : '';
    $scope.roomName = (!item.newTable) ? item.table.roomName : '';
    $scope.rooms = [];

    RoomService.getRooms(false, null, null, function (currentPage, pages, rooms) {
        $scope.rooms = rooms;
    });

    $scope.cancel = function () {
        dialog.close(false);
    };

    $scope.save = function () {
        if ($scope.newTable) {
            TableService.addTable({
                tableName: $scope.tableName,
                roomName: $scope.roomName,
                status: 'Open'
            }, function (data) {
                if (data.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = data.message;
                }
            });
        } else {
            TableService.updateTable($scope.tableId, {
                tableName: $scope.tableName,
                roomName: $scope.roomName,
                status: 'Open'
            }, function (data) {
                if (data.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = data.message;
                }
            });
        }
    };
}]);

app.controller('RoomEditModalController', ['$scope', '$rootScope', 'RoomService', 'dialog', 'item', function ($scope, $rootScope, RoomService, dialog, item) {
    $scope.newRoom = item.newRoom;
    $scope.roomId = (!item.newRoom) ? item.room._id : '';
    $scope.roomName = (!item.newRoom) ? item.room.roomName : '';
    $scope.numPlayers = (!item.newRoom) ? item.room.numPlayers : 0;

    $scope.cancel = function () {
        dialog.close(false);
    };

    $scope.save = function () {
        if ($scope.newRoom) {
            RoomService.addRoom({
                roomName: $scope.roomName,
                numPlayers: $scope.numPlayers
            }, function (data) {
                if (data.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = data.message;
                }
            });
        } else {
            RoomService.updateRoom($scope.roomId, {
                roomName: $scope.roomName,
                numPlayers: $scope.numPlayers
            }, function (data) {
                if (data.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = data.message;
                }
            });
        }
    };
}]);

app.controller('UserEditModalController', ['$scope', '$rootScope', 'UserService', 'dialog', 'item', function ($scope, $rootScope, UserService, dialog, item) {
    $scope.newUser = item.newUser;
    $scope.uid = (!item.newUser) ? item.user._id : '';
    $scope.username = (!item.newUser) ? item.user.username : '';
    $scope.email = (!item.newUser) ? item.user.email : '';
    $scope.isAdmin = (!item.newUser) ? item.user.isAdmin : false;
    $scope.password = '';
    $scope.confirmPassword = '';

    $scope.cancel = function () {
        dialog.close(false);
    };

    $scope.$watch('password', function () {
        if ($scope.newUser) {
            if ($scope.password.length == 0) {
                $scope.addEditUserForm.password.$setValidity('password', false);
            } else {
                $scope.addEditUserForm.password.$setValidity('password', true);
            }

            if ($scope.password != $scope.confirmPassword) {
                $scope.addEditUserForm.confirmPassword.$setValidity('confirmPassword', false);
            } else {
                $scope.addEditUserForm.confirmPassword.$setValidity('confirmPassword', true);
            }
        }
    });

    $scope.$watch('confirmPassword', function () {
        if ($scope.newUser) {
            if ($scope.confirmPassword.length == 0) {
                $scope.addEditUserForm.confirmPassword.$setValidity('confirmPassword', false);
            } else {
                $scope.addEditUserForm.confirmPassword.$setValidity('confirmPassword', true);
            }

            if ($scope.password != $scope.confirmPassword) {
                $scope.addEditUserForm.confirmPassword.$setValidity('confirmPassword', false);
            } else {
                $scope.addEditUserForm.confirmPassword.$setValidity('confirmPassword', true);
            }
        }
    });

    $scope.save = function () {
        if ($scope.newUser) {
            UserService.addUser({
                username: $scope.username,
                email: $scope.email,
                isAdmin: $scope.isAdmin,
                password: $scope.password
            }, function (payload) {
                if (payload.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = payload.message;
                }
            });
        } else {
            UserService.updateUser($scope.uid, {
                username: $scope.username,
                email: $scope.email,
                isAdmin: $scope.isAdmin
            }, function (payload) {
                if (payload.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = payload.message;
                }
            });
        }
    };
}]);
