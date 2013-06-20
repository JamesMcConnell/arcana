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
        updateUser:
            function (uid, userdata, callback) {
                $http.put('/api/users/' + uid, userdata).success(function (data) {
                    callback(data);
                });
            },
        addUser:
            function (userdata, callback) {
                $http.post('/api/users', userdata).success(function (data) {
                    callback(data);
                });
            },
        getUser:
            function (userId, callback) {
                $http.get('/api/users/' + userId).success(function (payload) {
                    callback(payload);
                })
            },
        getUsers:
            function (currentPage, numPerPage, callback) {
                $http({ method: 'GET', url: '/api/users', params: { currentPage: currentPage, numPerPage: numPerPage } }).success(function (data) {
                    callback(data.result.currentPage, data.result.pages, data.result.users);
                })
            }
    }
}).factory('NotificationService', function () {
    return {
        success: function (message) {
            toastr.success(message);
        },
        error: function (message) {
            toaster.error(message);
        }
    };
});
