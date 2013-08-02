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
            $scope.chatLog.push(data);
            $scope.safeApply();
            $scope.cleanChat();

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
    $scope.currentTable = {};

    RoomService.getRooms(false, null, null, function (currentPage, pages, rooms) {
        $scope.rooms = rooms;
        $scope.currentRoom = angular.copy($scope.rooms[0]);
        $scope.numPlayers = $scope.currentRoom.numPlayers;
        $scope.getTables($scope.currentRoom.roomName);

        $rootScope.$broadcast('userEnteredRoom',{
            roomName: $scope.currentRoom.roomName
        });
    });

    $scope.clearLeftMargin = function (index, divisor) {
        if (index % divisor == 0) {
            return { 'margin-left': '0px' };
        }

        return '';
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
            $scope.setCurrentTable();
            $scope.safeApply();
        });
    };

    $scope.setCurrentTable = function () {
        angular.forEach($scope.tables, function (tbl) {
            angular.forEach(tbl.seats, function (seat) {
                if (seat.username === $scope.currentUser.username) {
                    $scope.currentTable.tableId = tbl._id;
                    $scope.currentTable.seatId = seat._id;
                }
            });
        });
    };

    $scope.changeRoom = function (roomName) {
        $scope.currentRoom = angular.copy(_.find($scope.rooms, function (room) {
            return room.roomName == roomName;
        }));

        $scope.getTables($scope.currentRoom.roomName);

        // This removes the player from whichever seat they are currently at
        $rootScope.$broadcast('removePlayerFromSeat', {
            tableId: $scope.currentTable.tableId,
            seatId: $scope.currentTable.seatId
        });

        // This lets the ChatController know to change socket rooms
        $rootScope.$broadcast('userChangedRoom', {
            roomName: $scope.currentRoom.roomName,
            username: $scope.currentUser.username
        });
    };
});

app.controller('TableController', function ($scope, $rootScope, TableService) {
    $scope.table = {};
    $scope.socket = io.connect('/table');
    $scope.setTableLeader = false;

    $scope.init = function (table) {
        $scope.table = table;
    };

    $scope.useSeat = function (seat) {

    };

    $scope.canUserSit = function (seat) {
        return false;
    };

    $scope.getSeatText = function (seat) {
        return 'Take Seat'
    };

    $scope.seatHasOptions = function (seat) {
        return true;
    };

    $scope.takeSeat = function (seat) {
        // Check if user is already at a table
        if ($scope.currentTable.tableId && $scope.currentTable.seatId) {

            // Check if it is this table
            if ($scope.currentTable.tableId === $scope.table._id) {

                // Get their current seat
                var currentSeat = _.find($scope.table.seats, function (seat) {
                    return seat._id === $scope.currentTable.seatId;
                });

                // Remove them from current seat
                currentSeat.username = '';

                // Add them to new seat
                seat.username = $scope.currentUser.username;
                $scope.currentTable.tableId = $scope.table._id;
                $scope.currentTable.seatId = seat._id;

                // Update database
                TableService.updateTable($scope.table._id, $scope.table, function (data) {
                    if (data.success) {
                        // Tell other clients to remove player from seat
                        $scope.socket.emit('removePlayerFromSeat', {
                            tableId: $scope.currentTable.tableId,
                            seatId: $scope.currentTable.seatId
                        });

                        // Tell other clients to add player to new seat
                        $scope.socket.emit('addPlayerToSeat', {
                            tableId: $scope.currentTable.tableId,
                            seatId: $scope.currentTable.seatId,
                            username: $scope.currentUser.username
                        });
                    }
                });

                $scope.safeApply();
            } else { // Player is in a seat at another table

                // We want to raise a client-side event
                // so the controller for the current table
                // can properly remove the user,
                // and alert other clients of the change
                $rootScope.$broadcast('removePlayerFromSeat', {
                    tableId: $scope.currentTable.tableId,
                    seatId: $scope.currentTable.seatId
                });

                // Update current table
                $scope.currentTable.tableId = $scope.table._id;
                $scope.currentTable.seatId = seat._id;

                seat.username = $scope.currentUser.username;

                TableService.updateTable($scope.table._id, $scope.table, function (data) {
                    if (data.success) {
                        // Alert other clients to update
                        $scope.socket.emit('addPlayerToSeat', {
                            tableId: $scope.table._id,
                            seatId: seat._id,
                            username: $scope.currentUser.username
                        });

                        $scope.safeApply();
                    }
                });
            }
        } else {
            // User is not at a table
            seat.username = $scope.currentUser.username;
            $scope.currentTable.tableId = $scope.table._id;
            $scope.currentTable.seatId = seat._id;

            TableService.updateTable($scope.table._id, $scope.table, function (data) {
                if (data.success) {
                    // Alert other clients to update
                    $scope.socket.emit('addPlayerToSeat', {
                        tableId: $scope.table._id,
                        seatId: seat._id,
                        username: $scope.currentUser.username
                    });

                    $scope.safeApply();
                }
            });
        }
    };

    $scope.leaveSeat = function (seat) {
        seat.username = '';
        $scope.currentTable = {};

        TableService.updateTable($scope.table._id, $scope.table, function (data) {
            if (data.success) {
                // Alert other clients to update
                $scope.socket.emit('removePlayerFromSeat', {
                    tableId: $scope.table._id,
                    seatId: seat._id
                });

                $scope.safeApply();
            }
        });
    };

    $scope.socket.on('removePlayerFromSeat', function (data) {
        if (data.tableId === $scope.table._id) { // Only respond if we own this table
            var seat = _.find($scope.table.seats, function (item) {
                return item._id === data.seatId;
            });
            if (seat) {
                seat.username = '';
                $scope.safeApply();
            }
        }
    });

    $scope.socket.on('addPlayerToSeat', function (data) {
        if (data.tableId === $scope.table._id) { // Only respond if we own this table
            var seat = _.find($scope.table.seats, function (item) {
                return item._id === data.seatId;
            });
            if (seat && seat.username.length == 0) {
                seat.username = data.username;
                $scope.safeApply();
            }
        }
    });

    $rootScope.$on('removePlayerFromSeat', function (scope, data) {
        if (data.tableId === $scope.table._id) { // Only respond if we own this table
            var seat = _.find($scope.table.seats, function (item) {
                return item._id === data.seatId;
            });

            if (seat) {
                seat.username = '';
                TableService.updateTable($scope.table._id, $scope.table, function (data) {
                    if (data.success) {
                        $scope.socket.emit('removePlayerFromSeat', {
                            tableId: $scope.table._id,
                            seatId: seat._id
                        });
                        $scope.safeApply();
                    }
                });
            }
        }
    });
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

app.controller('CardAdminController', function ($scope, $http, $dialog, CardService, NotificationService) {
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.cards = [];
    $scope.cardType = 'all';
    $scope.cardTypes = ['Battery', 'Creature', 'Buff', 'Debuff', 'Sorcery', 'Interrupt'];
    $scope.errorMessage = '';

    $scope.$watch('numPerPage', function () {
        $scope.getCards(1);
    });

    $scope.$watch('cardType', function () {
        $scope.getCards(1);
    });

    $scope.getCards = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            var cardType = ($scope.cardType == 'all') ? '' : $scope.cardType;
            CardService.getCards(true, page, $scope.numPerPage, cardType, function (currentPage, pages, cards) {
                $scope.currentPage = currentPage;
                $scope.pages = pages;
                $scope.cards = cards;
            });
        }
    };

    $scope.getPreviousPage = function () {
        $scope.getCards(parseInt($scope.currentPage) - 1);
    };

    $scope.getNextPage = function () {
        $scope.getTables(parseInt($scope.currentPage) + 1);
    };

    $scope.addCard = function () {
        var dialog = $dialog.dialog({
            dialogFade: true,
            resolve: {
                item: function () {
                    return {
                        newCard: true,
                        card: {
                            cardName: '',
                            cardType: '',
                            instanceCost: 0,
                            maintenanceCost: 0,
                            burnValue: 0,
                            genValue: 0,
                            health: 0,
                            power: 0,
                            isModifier: false,
                            modification: {
                                affectedStat: '',
                                modificationValue: 0,
                                duration: 0
                            }
                        }
                    };
                }
            }
        });

        dialog.open('/modals/addEditCardModal.html', 'CardEditModalController').then(function (status) {
            if (status) {
                NotificationService.success('Card successfully added!');
                $scope.getCards($scope.currentPage);
            }
        });
    };

    $scope.editCard = function (cardId) {
        CardService.getCard(cardId, function (data) {
            if (data.success) {
                var dialog = $dialog.dialog({
                    dialogFade: true,
                    resolve: {
                        item: function () {
                            return {
                                newCard: false,
                                card: angular.copy(data.result)
                            };
                        }
                    }
                });

                dialog.open('/modals/addEditCardModal.html', 'CardEditModalController').then(function (status) {
                    if (status) {
                        NotificationService.success('Card successfully updated!');
                        $scope.getCards($scope.currentPage);
                    }
                });
            } else {
                $scope.errorMessage = data.message;
            }
        });
    };

    $scope.viewCard = function (cardId) {
        CardService.getCard(cardId, function (data) {
            if (data.success) {
                var dialog = $dialog.dialog({
                    dialogFade: true,
                    dialogClass: 'modal span3',
                    resolve: {
                        item: function () {
                            return {
                                card: angular.copy(data.result)
                            };
                        }
                    }
                });

                dialog.open('/modals/viewCardModal.html', 'CardViewerModalController');
            }
        });
    };

    $scope.getCards($scope.currentPage);
});

app.controller('CardViewerModalController', ['$scope', 'dialog', 'item', function ($scope, dialog, item) {
    $scope.card = item.card;
}]);

app.controller('CardEditModalController', ['$scope', '$rootScope', 'CardService', 'dialog', 'item', function ($scope, $rootScope, CardService, dialog, item) {
    $scope.newCard = item.newCard;
    $scope.cardId = (!item.newCard) ? item.card._id : '';
    $scope.card = item.card;
    $scope.cardTypes = ['Battery', 'Creature', 'Buff', 'Debuff', 'Sorcery', 'Interrupt'];
    $scope.affectedStats = ['Maintenance Cost', 'Burn Value', 'Gen Value', 'Health', 'Power', 'Arcane Energy'];
    $scope.errorMessage = '';

    $scope.cancel = function () {
        dialog.close(false);
    };

    $scope.$watch('card.cardType', function () {
        $scope.card.isModifier = ($scope.card.cardType == 'Buff' || $scope.card.cardType == 'Debuff' || $scope.card.cardType == 'Sorcery');
    });

    $scope.save = function () {
        if ($scope.newCard) {
            CardService.addCard({
                cardName: $scope.card.cardName,
                cardType: $scope.card.cardType,
                instanceCost: $scope.card.instanceCost,
                maintenanceCost: $scope.card.maintenanceCost,
                burnValue: $scope.card.burnValue,
                genValue: $scope.card.genValue,
                health: $scope.card.health,
                power: $scope.card.power,
                isModifier: $scope.card.isModifier,
                modification: $scope.card.modification
            }, function (data) {
                if (data.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = data.message;
                }
            });
        } else {
            CardService.updateCard($scope.cardId, {
                cardName: $scope.card.cardName,
                cardType: $scope.card.cardType,
                instanceCost: $scope.card.instanceCost,
                maintenanceCost: $scope.card.maintenanceCost,
                burnValue: $scope.card.burnValue,
                genValue: $scope.card.genValue,
                health: $scope.card.health,
                power: $scope.card.power,
                isModifier: $scope.card.isModifier,
                modification: $scope.card.modification
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

    $scope.populateTables = function () {
        RoomService.getRooms(false, null, null, function (currentPage, pages, rooms) {
            var tableNames = [];
            angular.forEach(rooms, function (room) {
                switch (room.roomName) {
                    case 'Randland':
                        tableNames = ["Altara","Amadicia","Andor","Arad Doman","Arafel","Kandor","Malkier","Saldaea","Shienar","Cairhien","Ghealdan","Illian","Murandy","Tarabon","Tear"];
                        break;
                    case 'Westeros':
                        tableNames = ["Winterfell","Pyke","Harrenhal","Riverrun","The Twins","Casterly Rock","Lannisport","Oldtown","Storm's End","Dragonstone","King's Landing","The Wall","The Eyrie","Dorne","Braavos"];
                        break;
                    case 'Shadowmarch':
                        tableNames = ["Twilight Lands","Vuttish","Connord","Southmarch","Brenland","Settland","Perikal","Syan","Fael","Krace","Ulos","Akaris","Hierosol","Devonis","Xand"];
                        break;
                    case 'Middle-Earth':
                        tableNames = ["Arnor","Bree-land","Erebor","Esgaroth","Fangorn","Gondor","Helm's Deep","Isengard","Khazad-dum","Lothlorien","Mordor","Mirkwood","Rivendell","Rohan","The Shire"];
                }

                angular.forEach(tableNames, function (tableName) {
                    var table = {
                        tableName: tableName,
                        roomName: room.roomName,
                        status: 'Open',
                        seats: [],
                        leader: ''
                    };

                    for (var i = 1; i <= room.numPlayers; i++) {
                        table.seats.push({
                            username: '',
                            position: i,
                            isLeader: false
                        });
                    }

                    TableService.addTable(table, function (data) {
                        if (data.success) {
                            console.log('Table "' + data.table.tableName + '" added successfully');
                        }
                    });
                });
            });
        });

        $scope.getTables($scope.currentPage);
    };

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

    $scope.kickPlayer = function (tableId, position) {
        var table = _.find($scope.tables, function (table) {
            return table._id == tableId;
        });

        var seat = _.find(table.seats, function (seat) {
            return seat.position == position;
        });

        seat.username = '';
        TableService.updateTable(tableId, table, function (data) {});

        $scope.getTables($scope.currentPage);
    };

    $scope.addTable = function () {
        var dialog = $dialog.dialog({
            dialogFade: true,
            resolve: {
                item: function () {
                    return {
                        newTable: true,
                        table: {
                            tableName: '',
                            roomName: ''
                        }
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

app.controller('TableEditModalController', ['$scope', '$rootScope', 'RoomService', 'TableService', 'dialog', 'item', function ($scope, $rootScope, RoomService, TableService, dialog, item) {
    $scope.newTable = item.newTable;
    $scope.tableId = (!item.newTable) ? item.table._id : '';
    $scope.table = item.table;
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
                tableName: $scope.table.tableName,
                roomName: $scope.table.roomName,
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
                tableName: $scope.table.tableName,
                roomName: $scope.table.roomName,
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

app.controller('RoomAdminController', function ($scope, $http, $dialog, RoomService, NotificationService) {
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.rooms = [];
    $scope.errorMessage = '';

    $scope.$watch('numPerPage', function () {
        $scope.getRooms(1);
    });

    /* Populate room data */
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
                        room: {
                            roomName: '',
                            numPlayers: 0
                        }
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

app.controller('RoomEditModalController', ['$scope', '$rootScope', 'RoomService', 'dialog', 'item', function ($scope, $rootScope, RoomService, dialog, item) {
    $scope.newRoom = item.newRoom;
    $scope.roomId = (!item.newRoom) ? item.room._id : '';
    $scope.room = item.room;

    $scope.cancel = function () {
        dialog.close(false);
    };

    $scope.save = function () {
        if ($scope.newRoom) {
            RoomService.addRoom({
                roomName: $scope.room.roomName,
                numPlayers: $scope.room.numPlayers
            }, function (data) {
                if (data.success) {
                    dialog.close(true);
                } else {
                    $scope.errorMessage = data.message;
                }
            });
        } else {
            RoomService.updateRoom($scope.roomId, {
                roomName: $scope.room.roomName,
                numPlayers: $scope.room.numPlayers
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
                        user: {
                            username: '',
                            email: '',
                            isAdmin: false
                        }
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

app.controller('UserEditModalController', ['$scope', '$rootScope', 'UserService', 'dialog', 'item', function ($scope, $rootScope, UserService, dialog, item) {
    $scope.newUser = item.newUser;
    $scope.uid = (!item.newUser) ? item.user._id : '';
    $scope.user = item.user;
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
                username: $scope.user.username,
                email: $scope.user.email,
                isAdmin: $scope.user.isAdmin,
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
                username: $scope.user.username,
                email: $scope.user.email,
                isAdmin: $scope.user.isAdmin
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