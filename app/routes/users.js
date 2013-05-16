module.exports = function (app) {
    var mongoose = require('mongoose');
    var User = require('../models/user');

    app.post('/users/login', function (req, res) {
        var username = req.body.username;
        var password = req.body.password;

        User.findOne({ username: username }, function (err, user) {
            if (err) {
                console.log(err);
            }

            if (user) {
                user.comparePassword(password, function (err, isMatch) {
                    if (err) {
                        console.log(err);
                    }

                    if (isMatch) {
                        req.session.user = user;
                        res.cookie('arcana_user', user._id.toString(), { httpOnly: false });
                        res.cookie('arcana_admin', user.isAdmin, { httpOnly: false });
                        res.send({ status: 'success', message: 'Login Successful', user: user });
                    } else {
                        req.session.user = {};
                        res.clearCookie('arcana_user');
                        res.clearCookie('arcana_admin');
                        res.send({ status: 'error', message: 'Invalid Credentials' });
                    }
                });
            } else {
                req.session.user = {};
                res.clearCookie('arcana_user');
                res.clearCookie('arcana_admin');
                res.send({ status: 'error', message: 'Invalid Credentials' });
            }
        });
    });

    app.post('/users', function (req, res) {
        var isAdmin = false;
        var username = req.body.username;
        var email = req.body.email;
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var password = req.body.password;
        var isAdmin = req.body.isAdmin;
        if (req.body.isAdmin == 'true') {
            isAdmin = true;
        }

        var user = new User({
            username: username,
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: password,
            isAdmin: isAdmin
        });
        user.save(function (err) {
            if (err) {
                if (err.code == '11000') {
                    return res.send({ status: 'error', message: 'A user with this name already exists' });
                }
            }
            res.send({ status: 'success', message: 'New user "' + user.username + '" has been created.' });
        });
    });

    app.get('/users/logout', function (req, res) {
        req.session.user = {};
        res.clearCookie('arcana_user');
        res.clearCookie('arcana_admin');
        res.send({ status: 'success', message: 'You have logged out.' });
    });
}
