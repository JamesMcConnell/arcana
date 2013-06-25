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

app.controller('LobbyController', function ($scope, $rootScope, UserService) {
    //noinspection JSUnresolvedVariable
    $scope.chat = io.connect('/lobby');
    $scope.chatMsg = '';
    $scope.chatLog = [];
    $scope.maxChatLogSize = 2000;
    $scope.currentUser = {};

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
                user: $scope.me.username + '.',
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
            UserService.getUsers(page, $scope.numPerPage, function (currentPage, pages, users) {
                $scope.currentPage = currentPage;
                $scope.pages = pages;
                $scope.users = users;
            });
        }
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

app.controller('UserEditModalController', ['$scope', '$rootScope', 'UserService', 'dialog', 'item', function ($scope, $rootScope, UserService, dialog, item) {
    $scope.newUser = item.newUser;
    $scope.uid = (!item.newUser) ? item.user._id: '';
    $scope.username = (!item.newUser) ? item.user.username: '';
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
