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
}).factory('Table', function ($rootScope, $http) {
    return {
        updateTable:
            function (tid, tableData) {
                $http.put('/tables/' + tid, tableData).success(function (data, status) {
                    if (data.status == 'success') {
                        $rootScope.$broadcast('table:updateTable');
                    } else {
                        // messaging
                    }
                })
            },
        addTable:
            function (tableData) {
                $http.post('/tables', tableData).success(function (data, status) {
                    if (data.status == 'error') {
                        console.log(data);
                    }
                });
            }
    }
}).factory('User', function ($rootScope, $http, $cookies, $location, Toastr, Messages) {
    var currentUser = {};
    var userBeingEdited = {};
    var editingSelf = false;

    if ($cookies.arcana_admin) {
        if ($cookies.arcana_admin == 'true') {
            currentUser.isAdmin = true;
        } else {
            currentUser.isAdmin = false;
        }
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
                                Messages.addMessage(data.message);
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
                            Messages.addMessage(data.message);
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
            },
        editUser:
            function (id) {
                if (id == 'new') {
                    userBeingEdited = {};
                    editingSelf = false;
                    $rootScope.$broadcast('user:editUser');
                } else {
                    $http.get('/users/' + id).success(function (data, status) {
                        userBeingEdited = data;
                        if (data.username == currentUser.username) {
                            editingSelf = true;
                        } else {
                            editingSelf = false;
                        }

                        $rootScope.$broadcast('user:editUser');
                    });
                }
            },
        getEditUser:
            function () {
                return {
                    editing: userBeingEdited,
                    self: editingSelf
                };
            },
        updateUser:
            function (uid, userdata) {
                $http.put('/users/' + uid, userdata).success(function (data, status) {
                    if (data.status == 'success') {
                        $rootScope.$broadcast('user:updateUser');
                        // messaging
                    } else {
                        // messaging
                    }
                });
            },
        addUser:
            function (userdata) {
                $http.post('/users', userdata).success(function (data, status) {
                    if (data.status == 'success') {
                        $rootScope.$broadcast('user:addUser');
                        // messaging
                    } else {
                        // messaging
                    }
                });
            }
    }
}).factory('Toastr', function ($rootScope) {
    var queue = [],
        currentMessage = {};

    $rootScope.$on('$routeChangeSuccess', function () {
        if (queue.length > 0) {
            currentMessage = queue.shift();
        } else {
            currentMessage = {};
        }
    });

    return {
        showToast:
            function (message) {
                toastr.options.timeOut = message.timeOut || 5000;
                toastr.options.positionClass = 'toast-top-right';
                switch (message.type) {
                    case 'success':
                        toastr.success(message.body, message.title);
                        break;
                    case 'info':
                        toastr.info(message.body, message.title);
                        break;
                    case 'warning':
                        toastr.warning(message.body, message.title);
                        break;
                    case 'error':
                        toastr.error(message.body, message.title);
                        break;
                }
            },
        setToast:
            function (message) {
                queue.push(message);
            },
        getToast:
            function (message) {
                return currentMessage;
            }
    };
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
