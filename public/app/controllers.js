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
    $scope.messages = Messages;
    $scope.flashMessages = [];

    $scope.$watch('messages.getAll()', function (messages) {
        $scope.flashMessages = messages;
    });
});

app.controller('ChatController', function ($scope, $http, $rootScope, User) {
    $scope.chat = io.connect('/chat');
    $scope.user = User;
    $scope.me = {};
    $scope.incoming = '';
    $scope.chatMsg = '';
    $scope.chatLog = [];
    $scope.maxSize = 2000;

    $scope.$watch('user.me()', function (u) {
        $scope.me = u;
    });

    $scope.chat.on('init', function (data) {
        if (data && $scope.chatLog.length < 1) {
            $scope.chatLog = data;
            $scope.safeApply();
            $scope.cleanUp();
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
                timestamp: new Date().getTime()
            };

            $scope.chat.emit('message', data);
            $scope.chatMsg = '';
        }
    };

    $scope.cleanUp = function() {
        if ($scope.chatLog.length > ($scope.maxSize - 1)) {
            $scope.chatLog.splice(0, ($scope.chatLog.length - ($scope.maxSize - 1)));
        }
        var chatBox = $('#chat-message-pane');
        chatBox.animate({ "scrollTop": chatBox[0].scrollHeight }, "slow");
    };
});
