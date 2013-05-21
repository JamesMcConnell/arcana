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
    $scope.chat = io.connect('/lobbyChat');
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

app.controller('TableAdminController', function ($scope, $http, $rootScope, Page, Table) {
    Page.setTitle('Table Administration');
    $scope.activeTab = 'two-player';
    $scope.tabs = [
        { id: 'two-player', title: 'Two Player', partial: 'partials/admin-table-list' },
        { id: 'three-player', title: 'Three Player', partial: 'partials/admin-table-list' },
        { id: 'four-player', title: 'Four Player', partial: 'partials/admin-table-list' },
        { id: 'six-player', title: 'Six Player', partial: 'partials/admin-table-list' }
    ];

    $scope.setActiveTab = function (tab) {
        $scope.activeTab = tab;
    }
});

app.controller('TableListAdminController', function ($scope, $http, $rootScope, Table) {
    $scope.me = User.me();
    $scope.currentPage = 1;
    $scope.pages = 1;
    $scope.numPerPage = 10;
    $scope.tables = [];

    $scope.$watch('numPerPage', function () {
        $scope.getTables(1);
    });

    $scope.getTables = function (page) {
        if (page >= 1 && page <= $scope.pages) {
            $http({ method: 'GET', url: '/tables', params: { currentPage: page, numPerPage: $scope.numPerPage } }).success(function (data, status, headers, config) {
                $scope.currentPage = data.currentPage;
                $scope.pages = data.pages;
                $scope.tables = data.tables;
            });
        }
    };

    $scope.editTable = function (id) {
        Table.editTable(id);
    }

    $rootScope.$on('table:addTable', function () {
        $scope.getTables($scope.currentPage);
    });

    $rootScope.$on('table:updateTable', function () {
        $scope.getTables($scope.currentPage);
    })

    $scope.getTables($scope.currentPage);
})

app.controller('TableEditModalController', function ($scope, $http, $rootScope, User, Table) {
    $scope.user = User;
    $scope.newTable = false;
    $scope.tid = '';
    $scope.tableName = '';
    $scope.isPrivate = false;
    $scope.incomplete = false;

    $scope.$watch('tableName', function () {
        $scope.incompleteTest();
    });

    $scope.incompleteTest = function () {
        if (!$scope.tableName.length) {
            $scope.incomplete = true;
        } else {
            $scope.incomplete = false;
        }
    };

    $rootScope.$on('table:editTable', function () {
        $scope.editTable = Table.getEditTable();
        if ($scope.editTable.editing._id) {
            $scope.tableName = $scope.editTable.editing.tableName;
            $scope.isPrivate = $scope.editTable.editing.isPrivate;
            $scope.incomplete = false;
            $scope.newTable = false;
        } else {
            $scope.tableName = '';
            $scope.isPrivate = false;
        }
    });

    $scope.save = function () {
        if ($scope.newTable) {
            Table.addTable({
                tableName: $scope.tableName,
                isPrivate: $scope.isPrivate,
                hasUsers: false,
                seatOne: null,
                seatTwo: null,
                seatThree: null,
                seatFour: null
            });
        } else {
            Table.updateTable($scope.tid, {
                tableName: $scope.tableName,
                isPrivate: $scope.isPrivate
            });
        }
    };
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
        $scope.getUsers($scope.currentPage);
    });

    $scope.getUsers($scope.currentPage);
});

app.controller('UserEditModalController', function ($scope, $http, $rootScope, User) {
    $scope.user = User;
    $scope.newUser = false;
    $scope.uid = '';
    $scope.username = '';
    $scope.firstName = '';
    $scope.lastName = '';
    $scope.isAdmin = false;
    $scope.pw1 = '';
    $scope.pw2 = '';
    $scope.pwError = false;
    $scope.incomplete = false;

    $scope.$watch('pw1', function () {
        if ($scope.pw1 !== $scope.pw2) {
            $scope.pwError = true;
        } else {
            $scope.pwError = false;
        }

        $scope.incompleteTest();
    });

    $scope.$watch('pw2', function () {
        if ($scope.pw1 !== $scope.pw2) {
            $scope.pwError = true;
        } else {
            $scope.pwError = false;
        }

        $scope.incompleteTest();
    });

    $scope.$watch('username', function () {
        $scope.incompleteTest();
    });

    $scope.incompleteTest = function () {
        if ($scope.newUser) {
            if (!$scope.username.length || !$scope.pw1.length || !$scope.pw2.length) {
                $scope.incomplete = true;
            } else {
                $scope.incomplete = false;
            }
        } else {
            $scope.incomplete = false;
        }
    };

    $rootScope.$on('user:editUser', function () {
        $scope.editUser = User.getEditUser();
        if ($scope.editUser.editing._id) {
            $scope.username = $scope.editUser.editing.username;
            $scope.firstName = $scope.editUser.editing.firstName;
            $scope.lastName = $scope.editUser.editing.lastName;
            $scope.isAdmin = $scope.editUser.editing.isAdmin;
            $scope.uid = $scope.editUser.editing._id;
            $scope.incomplete = false;
            $scope.newUser = false;
        } else {
            $scope.username = '';
            $scope.firstName = '';
            $scope.lastName = '';
            $scope.isAdmin = false;
            $scope.pw1 = '';
            $scope.pw2 = '';
            $scope.incomplete = true;
            $scope.newUser = true;
        }
    });

    $scope.save = function () {
        if ($scope.newUser) {
            User.addUser({
                username: $scope.username,
                firstName: $scope.firstName,
                lastName: $scope.lastName,
                isAdmin: $scope.isAdmin,
                password: $scope.pw1
            });
        } else {
            if ($scope.pw1.length) {
                User.updateUser($scope.uid, {
                    username: $scope.username,
                    firstName: $scope.firstName,
                    lastName: $scope.lastName,
                    isAdmin: $scope.isAdmin,
                    password: $scope.pw1
                });
            } else {
                User.updateUser($scope.uid, {
                    username: $scope.username,
                    firstName: $scope.firstName,
                    lastName: $scope.lastName,
                    isAdmin: $scope.isAdmin
                });
            }
        }
    };
});
