app.controller('MainController', function ($scope) {
    $scope.config = {};

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

});

app.controller('NavbarController', function ($scope) {
    $scope.currentUsername = '';
    $scope.isLoggedIn = false;
    $scope.isAdmin = false;

    $scope.init = function (userInfo) {
        if (userInfo.username === undefined) {
            $scope.currentUsername = '';
            $scope.isAdmin = false
            $scope.isLoggedIn = false;
        } else {
            $scope.currentUsername = userInfo.username;
            $scope.isAdmin = userInfo.isAdmin;
            $scope.isLoggedIn = true;
        }
    }
})

app.controller('LobbyController', function ($scope) {
    //noinspection JSUnresolvedVariable
    $scope.chat = io.connect('/lobbyChat');
    $scope.chatMsg = '';
    $scope.chatLog = [];
    $scope.currentUsers = [];
    $scope.maxChatLogSize = 2000;
    $scope.flashMessages = [];

    /*
     $scope.$watch('user.me()', function (u) {
     $scope.me = u;
     var data = {
     user: $scope.me.username + '.',
     body: $scope.me.username + ' has entered the lobby',
     serverGenerated: true,
     timestamp: new Date().getTime()
     };

     $scope.chat.emit('message', data);
     });
     */

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

app.controller('UserAdminController', function ($scope, $http, UserService) {
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.users = [];

    $scope.$watch('numPerPage', function () {
        $scope.getUsers(1);
    });

    $scope.getUsers = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            $http({ method: 'GET', url: '/api/users', params: {currentPage: page, numPerPage: $scope.numPerPage } }).success(function (data) {
                $scope.currentPage = data.result.currentPage;
                $scope.pages = data.result.pages;
                $scope.users = data.result.users;
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

    $scope.editUser = function (id) {
        UserService.editUser(id);
    };

    $scope.$on('user:addUser', function () {
        $scope.getUsers($scope.currentPage);
    });

    $scope.$on('user:updateUser', function () {
        $scope.getUsers($scope.currentPage);
    });

    $scope.testGetUser = function (userId) {
        UserService.getUser(userId, function (user) {
            var bp = '';
        });
    };

    $scope.getUsers($scope.currentPage);
});

app.controller('UserEditModalController', function ($scope, $rootScope, UserService) {
    $scope.newUser = false;
    $scope.uid = '';
    $scope.username = '';
    $scope.isAdmin = false;
    $scope.password = '';
    $scope.confirmPassword = '';
    $scope.passwordError = false;
    $scope.incomplete = false;

    $scope.$watch('password', function () {
        if ($scope.password !== $scope.confirmPassword) {
            $scope.passwordError = true;
        } else {
            $scope.passwordError = false;
        }

        $scope.incompleteTest();
    });

    $scope.$watch('confirmPassword', function () {
        if ($scope.password !== $scope.confirmPassword) {
            $scope.passwordError = true;
        } else {
            $scope.passwordError = false;
        }

        $scope.incompleteTest();
    });

    $scope.$watch('username', function () {
        $scope.incompleteTest();
    });

    $scope.incompleteTest = function () {
        if ($scope.newUser) {
            if (!$scope.username.length || !$scope.password.length || !$scope.confirmPassword.length) {
                $scope.incomplete = true;
            } else {
                $scope.incomplete = false;
            }
        } else {
            $scope.incomplete = false;
        }
    };

    $rootScope.$on('user:editUser', function () {
        $scope.editUser = UserService.getEditUser();
        if ($scope.editUser.editing._id) {
            $scope.username = $scope.editUser.editing.username;
            $scope.isAdmin = $scope.editUser.editing.isAdmin;
            $scope.uid = $scope.editUser.editing._id;
            $scope.newUser = false;
        } else {
            $scope.username = '';
            $scope.isAdmin = false;
            $scope.password = '';
            $scope.confirmPassword = '';
            $scope.newUser = true;
        }
    });

    $scope.save = function () {
        if ($scope.newUser) {
            UserService.addUser({
                username: $scope.username,
                firstName: $scope.firstName,
                lastName: $scope.lastName,
                isAdmin: $scope.isAdmin,
                password: $scope.password
            });
        } else {
            if ($scope.password.length) {
                UserService.updateUser($scope.uid, {
                    username: $scope.username,
                    firstName: $scope.firstName,
                    lastName: $scope.lastName,
                    isAdmin: $scope.isAdmin,
                    password: $scope.password
                });
            } else {
                UserService.updateUser($scope.uid, {
                    username: $scope.username,
                    firstName: $scope.firstName,
                    lastName: $scope.lastName,
                    isAdmin: $scope.isAdmin
                });
            }
        }
    };
});
