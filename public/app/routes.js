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
        otherwise({
            redirectTo: '/home',
            controller: 'IndexController'
        });
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
}]);
