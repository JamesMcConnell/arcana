angular.module('appServices', ['ngCookies']).factory('Page', function ($rootScope) {
    var siteName = 'Arcana';
    var pageTitle = '';

    return {
        title:
            function (includeSiteName) {
                if (includeSiteName) {
                    return siteName + ' :: ' + pageTitle;
                }
                return pageTitle;
            },
        setTitle:
            function (newTitle) {
                pageTitle = newTitle;
            }
    }
}).factory('User', function ($rootScope, $http, $cookies, $location) {
    var currentUser = {};

    if ($cookies.arcana_admin) {
        currentUser.IsAdmin = true;
    } else {
        currentUser.isAdmin = false;
    }

    return {
        resume:
            function () {
                $http.get('/users/' + $cookies.arcana_user).success(function (data, status) {
                    currentUser = data;
                    $rootScope.$broadcast('user:login');
                });
            },
        login:
            function (username, password) {
                if (!currentUser._id) {
                    $http.post('/users/login', { username: username, password: password }).success(function (data, status) {
                        switch (data.status) {
                            case 'success':
                                currentUser = data.user;
                                $cookies.arcana_user = data.user._id;
                                $cookies.arcana_admin = data.user.isAdmin;
                                $location.path('/home');
                                $rootScope.$broadcast('user:login');
                                break;
                            case 'error':
                                currentUser = {};
                                break;
                        }
                    });
                }
            },
        register:
            function (username, password, email, firstName, lastName, isAdmin) {
                $http.post('/users', { username: username, password: password, email: email, firstName: firstName, lastName: lastName, isAdmin: false }).success(function (data, status) {
                    switch (data.status) {
                        case 'success':
                            currentUser = data.user;
                            $cookies.arcana_user = data.user._id;
                            $cookies.arcana_admin = data.user.isAdmin;
                            $location.path('/home');
                            $rootScope.$broadcast('user:login');
                            break;
                        case 'error':
                            currentUser = {};
                            break;
                    }
                });
            },
        logout:
            function () {
                if (currentUser._id) {
                    $http.get('/users/logout').success(function (data, status) {
                        currentUser = {};
                        $location.path('/login');
                        $rootScope.$broadcast('user:login');
                    })
                }
            },
        me:
            function() {
                return currentUser;
            }
    }
})
