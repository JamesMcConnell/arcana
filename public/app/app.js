var app = angular.module('arcana', ['appServices', 'ngCookies']);

app.filter('chatTime', function () {
    return function (raw) {
        return moment(raw).format('h:mma');
    }
})
