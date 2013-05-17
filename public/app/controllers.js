app.controller('MainController', function ($scope, $rootScope, $http, $location, $cookies, Page, User) {
    $scope.config = {};
    $scope.user = User;
    $scope.Page = Page;
    $scope.loggedIn = false;

    $scope.$watch('user.me().username', function (name) {
        $scope.loggedIn = name;
    });

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

app.controller('NavbarController', function ($scope, $http, $rootScope, $location, User) {
    $scope.user = User;

    $rootScope.$on('user:login', function () {
        $scope.me = $scope.user.me();
    });

    $scope.$watch('user.me()', function (me) {
        $scope.me = me;
    });

    $scope.logout = function () {
        User.logout();
    }
});

app.controller('IndexController', function ($scope, $http, $rootScope, Page, User) {
    Page.setTitle('Home');
    $scope.user = User;

    $rootScope.$on('user:login', function () {
        $scope.user = $scope.user.me();
    });
});

app.controller('LoginController', function ($scope, $rootScope, $http, $location, User, Page, Messages) {
    Page.setTitle('Login');
    $scope.user = User;
    $scope.username = '';
    $scope.password = '';
    $scope.validation = Messages;
    $scope.validationMessages = [];

    $scope.$watch('User.me().username', function (loggedIn) {
        if (loggedIn) {
            $location.path('/home');
        }
    });

    $scope.$watch('validation.getAll()', function (messages) {
        $scope.validationMessages = messages;
    })

    $scope.login = function () {
        Messages.clearMessages();
        User.login($scope.username, $scope.password);
    }
});

app.controller('RegisterController', function ($scope, $rootScope, $http, $location, User, Page, Messages) {
    Page.setTitle('Register');
    $scope.user = User;
    $scope.validation = Messages;
    $scope.username = '';
    $scope.email = '';
    $scope.firstName = '';
    $scope.lastName = '';
    $scope.password = '';
    $scope.validationMessages = [];

    $scope.$watch('User.me().username', function (loggedIn) {
        if (loggedIn) {
            $location.path('/home');
        }
    });

    $scope.$watch('validation.getAll()', function (messages) {
        $scope.validationMessages = messages;
    });

    $scope.register = function () {
        Messages.clearMessages();
        User.register($scope.username, $scope.password, $scope.email, $scope.firstName, $scope.lastName, false);
    }
});

app.controller('LobbyController', function ($scope, $rootScope, $http, $location, User, Page, Messages) {
    Page.setTitle('Lobby');
    $scope.user = User;
    $scope.chat = io.connect('/lobby');
    $scope.chatMsg = '';
    $scope.chatLog = [];
    $scope.currentUsers = [];
    $scope.maxChatLogSize = 2000;
    $scope.messages = Messages;
    $scope.flashMessages = [];

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

    $scope.chat.on('init', function (data) {
        if (data && $scope.chatLog.length < 1) {
            $scope.chatLog = data;
            $scope.safeApply();
            $scope.cleanUp();
        }
    });

    $scope.chat.on('disconnect', function() {
        var data = {
            user: $scope.me.username + '.',
            body: $scope.me.username + ' has left the lobby',
            serverGenerated: true,
            timestamp: new Date().getTime()
        };

        $scope.chat.emit('message', data);
    })

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

    $scope.$watch('messages.getAll()', function (messages) {
        $scope.flashMessages = messages;
    });
});

app.controller('AdminController', function ($scope, $http, $location, Page, User) {
    Page.setTitle('Adminstration');
    $scope.activeTab = 'users';
    $scope.tabs = [
        { id: 'users', title: 'Users', partial: 'partials/admin-users.html' },
        { id: 'tables', title: 'Tables', partial: 'partials/admin-tables.html' }
    ];

    $scope.setActiveTab = function (tab) {
        $scope.activeTab = tab;
    }
});

app.controller('UserAdminController', function ($scope, $http, $rootScope, User) {
    $scope.me = User.me();
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.users = [];

    $scope.$watch('numPerPage', function () {
        $scope.getUsers(1);
    });

    $scope.editModal = 'partials/user-edit-modal.html';

    $scope.getUsers = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            $http({ method: 'GET', url: '/users', params: {currentPage: page, numPerPage: $scope.numPerPage } }).success(function (data, status, headers, config) {
                $scope.currentPage = data.currentPage;
                $scope.pages = data.pages;
                $scope.users = data.users;
            });
        }
    };

    $scope.removeUser = function (id) {
        $http({ method: 'DELETE', url: '/users/' + id }).success(function (data, status, headers, config) {
            if (data.status == 'error') {
                // messaging
            } else {
                // messaging
                $scope.getUsers($scope.currentPage);
            }
        });
    };

    $scope.editUser = function (id) {
        User.editUser(id);
    };

    $scope.$on('user:addUser', function () {
        $scope.getUsers($scope.currentPage);
    });

    $scope.$on('user:updateUser', function () {
        $scope.getUsers($scope.curentPage);
    });

    $scope.getUsers($scope.currentPage);
})
