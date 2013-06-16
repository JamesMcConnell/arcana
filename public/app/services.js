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
}).factory('UserService', function ($rootScope, $http) {
    var userBeingEdited = {};

    return {
        editUser:
            function (id) {
                if (id == 'new') {
                    userBeingEdited = {};
                    $rootScope.$broadcast('user:editUser');
                } else {
                    $http.get('api/users/' + id).success(function (data) {
                        userBeingEdited = data;
                        $rootScope.$broadcast('user:editUser');
                    });
                }
            },
        getEditUser:
            function () {
                return {
                    editing: userBeingEdited
                };
            },
        updateUser:
            function (uid, userdata, callback) {
                $http.put('/api/users/' + uid, userdata).success(function (data) {
                    if (data.status == 'success') {
                        $rootScope.$broadcast('user:updateUser');
                        // messaging
                    } else {
                        // messaging
                    }
                });
            },
        addUser:
            function (userdata, callback) {
                $http.post('/api/users', userdata).success(function (data) {
                    if (data.status == 'success') {
                        $rootScope.$broadcast('user:addUser');
                        // messaging
                    } else {
                        // messaging
                    }
                });
            },
        getUser:
            function (userId, callback) {
                $http.get('/api/users/' + userId).success(function (data) {
                    callback(data);
                })
            }
    }
}).factory('Messages', function ($rootScope) {
    var messages = [],
        currentMessage = {};

    $rootScope.$on('$routeChangeSuccess', function () {
        if (messages.length > 0) {
            messages = [];
        }
    });

    return {
        getAll:
            function () {
                return messages;
            },
        addMessage:
            function (message) {
                messages.push(message);
            },
        clearMessages:
            function () {
                messages = [];
            }
    }
});
