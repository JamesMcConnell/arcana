var app = angular.module('arcana', ['appServices', 'ngCookies', 'ui.bootstrap']);

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

app.directive("confirmPassword", function () {
    return {
        require: "ngModel",
        link: function (scope, elem, attrs, ctrl) {
            ctrl.$parsers.push(function (value) {
                if (value === scope.password) {
                    ctrl.$setValidity("confirmPassword", true);
                    return value;
                }
                ctrl.$setValidity("confirmPassword", false);
            });
        }
    }
});

app.directive('prependDivider', function () {
    return {
        restrict: 'A',
        link: function (scope, elem) {
            elem.prepend('<li class="divider"></li>');
        }
    }
});