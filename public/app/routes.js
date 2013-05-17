app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
    $routeProvider.
        when('/home', {
            templateUrl: 'partials/index.html',
            controller: 'IndexController'
        }).
        when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'LoginController'
        }).
        when('/register', {
            templateUrl: 'partials/register.html',
            controller: 'RegisterController'
        }).
        when('/lobby', {
            templateUrl: 'partials/lobby.html',
            controller: 'LobbyController'
        }).
        when('/admin', {
            templateUrl: 'partials/admin.html',
            controller: 'AdminController'
        }).
        otherwise({
            redirectTo: '/home',
            controller: 'IndexController'
        });
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
}]);
