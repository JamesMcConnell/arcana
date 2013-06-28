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

app.controller('LobbyController', function ($scope, $rootScope, UserService, RoomService) {
    //noinspection JSUnresolvedVariable
    $scope.chat = io.connect('/lobby');
    $scope.chatMsg = '';
    $scope.chatLog = [];
    $scope.maxChatLogSize = 2000;
    $scope.currentUser = {};

    $scope.rooms = [];
    $scope.currentRoom = '';

    RoomService.getRooms(false, null, null, function (currentPage, pages, rooms) {
        $scope.rooms = rooms;
        $scope.currentRoom = $scope.rooms[0].roomName;
    });

    $rootScope.$on('currentUser', function () {
        var user = UserService.currentUser();
        if (user._id) {
            $scope.currentUser.uid = user._id;
            $scope.currentUser.username = user.username;
            $scope.currentUser.isAdmin = user.isAdmin;

            var chatMsg = {
                user: $scope.currentUser.username,
                body: $scope.currentUser.username + ' has entered the lobby',
                serverGenerated: true,
                timestamp: new Date().getTime()
            };

            $scope.chat.emit('message', chatMsg);
        }
    });

    $scope.chat.on('message', function (data) {
        $scope.chatLog.push(data);
        $scope.safeApply();
        $scope.cleanUp();
    });

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

    $scope.cleanUp = function() {
        if ($scope.chatLog.length > ($scope.maxChatLogSize - 1)) {
            $scope.chatLog.splice(0, ($scope.chatLog.length - ($scope.maxChatLogSize - 1)));
        }
        var chatBox = $('#chat-message-pane');
        chatBox.animate({ "scrollTop": chatBox[0].scrollHeight }, "slow");
    };
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
    $scope.selectedRoom = '';
    $scope.errorMessage = '';

    $scope.$watch('numPerPage', function () {
        $scope.getTables(1);
    });

    $scope.$watch('selectedRoom', function () {
        $scope.getTables(1);
    });

    $scope.getTables = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            TableService.getTables(true, page, $scope.numPerPage, $scope.selectedRoom, function (currentPage, pages, tables) {
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
