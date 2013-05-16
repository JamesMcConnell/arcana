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
    $scope.admin = $scope.user.isAdmin;
    $scope.loggedIn = false;

    $rootScope.$on('user:login', function () {
        $scope.user = $scope.user.me();
        $scope.admin = $scope.me.isAdmin;
        $scope.loggedIn = true;
    });
});

app.controller('LoginController', function ($scope, $rootScope, $http, $location, User, Page) {
    Page.setTitle('Login');
    $scope.user = User;
    $scope.username = '';
    $scope.password = '';

    $scope.$watch('User.me().username', function (loggedIn) {
        if (loggedIn) {
            $location.path('/home');
        }
    });

    $scope.login = function () {
        User.login($scope.username, $scope.password);
    }
});

app.controller('RegisterController', function ($scope, $rootScope, $http, $location, User, Page) {
    Page.setTitle('Register');
    $scope.user = User;
    $scope.username = '';
    $scope.email = '';
    $scope.firstName = '';
    $scope.lastName = '';
    $scope.password = '';

    $scope.$watch('User.me().username', function (loggedIn) {
        if (loggedIn) {
            $location.path('/home');
        }
    });

    $scope.register = function () {
        User.register($scope.username, $scope.password, $scope.email, $scope.firstName, $scope.lastName, false);
    }
});
