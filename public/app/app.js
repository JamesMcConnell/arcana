var app = angular.module('arcana', ['appServices', 'ngCookies']);

app.filter('chatTime', function () {
    return function (raw) {
        return moment(raw).format('h:mma');
    }
});

app.filter('range', function () {
    return function(input, total) {
        total = parseInt(total);
        for (var i = 0; i < total; i++) {
            input.push(i);
        }
        return input;
    };
});
