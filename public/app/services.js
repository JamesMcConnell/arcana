angular.module('appServices', ['ngCookies']).factory('UserService', function ($rootScope, $http) {
    var currentUser = {};

    return {
        me:
            function () {
                $http.get('/session').success(function (data) {
                    currentUser = data.user;
                    $rootScope.$broadcast('currentUser');
                });
            },
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
                $http.get('/api/users/' + userId).success(function (data) {
                    callback(data);
                });
            },
        getUsers:
            function (currentPage, numPerPage, callback) {
                $http({ method: 'GET', url: '/api/users', params: { currentPage: currentPage, numPerPage: numPerPage } }).success(function (data) {
                    callback(data.result.currentPage, data.result.pages, data.result.users);
                });
            },
        currentUser:
            function () {
                return currentUser;
            }
    };
}).factory('RoomService', function ($rootScope, $http) {
    return {
        getRooms:
            function (currentPage, numPerPage, callback) {
                $http({ method: 'GET', url: '/api/rooms', params: { currentPage: currentPage, numPerPage: numPerPage } }).success(function (data) {
                    callback(data.result.currentPage, data.result.pages, data.result.rooms);
                });
            },
        getRoom:
            function (roomId, callback) {
                $http.get('/api/rooms/' + roomId).success(function (data) {
                    callback(data);
                });
            },
        addRoom:
            function (roomData, callback) {
                $http.post('/api/rooms', roomData).success(function (data) {
                    callback(data);
                });
            },
        updateRoom:
            function (roomId, roomData, callback) {
                $http.put('/api/rooms/' + roomId, roomData).success(function (data) {
                    callback(data);
                });
            }
    };
}).factory('NotificationService', function () {
    return {
        success: function (message) {
            toastr.success(message);
        },
        error: function (message) {
            toastr.error(message);
        }
    };
});
