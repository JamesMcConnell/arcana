var db = require('../config/db-config');

module.exports = {
    index: function (req, res) {
        res.render('index.jade', {
            pageTitle: 'Arcana',
            userInfo: {
                username: req.user ? JSON.stringify(req.user.username) : 'undefined',
                isAdmin: req.user ? req.user.isAdmin : false
            }
        });
    },
    getRegister: function (req, res) {
        res.render('register.jade', {
            pageTitle: 'Register User',
            userInfo: {
                username: req.user ? JSON.stringify(req.user.username) : 'undefined',
                isAdmin: req.user ? req.user.isAdmin : false
            }
        });
    },
    postRegister: function (req, res) {
        db.saveUser({
            username: req.param('username'),
            password: req.param('password'),
            email: req.param('email')
        }, function (err, user, info) {
            if (err) {
                return res.json(200, { success: false, message: info.message });
            } else {
                req.logIn(user, function (err) {
                    if (err) {
                        console.log(err);
                    }
                });

                return res.json(200, { success: true });
            }
        });
    },
    lobby: function (req, res) {
        res.render('lobby.jade', {
            pageTitle: 'Lobby',
            userInfo: {
                username: JSON.stringify(req.user.username),
                isAdmin: req.user ? req.user.isAdmin : false
            }
        });
    },
    adminUsers: function (req, res) {
        res.render('admin-users.jade', {
            pageTitle: 'User Administration',
            userInfo: {
                username: JSON.stringify(req.user.username),
                isAdmin: true
            }
        });
    },
    getLogin: function (req, res) {
        res.render('login.jade', {
            pageTitle: 'Login',
            userInfo: {
                username: req.user ? JSON.stringify(req.user.username) : 'undefined',
                isAdmin: req.user ? req.user.isAdmin : false
            }
        });
    },
    logout: function (req, res) {
        req.logout();
        res.redirect('/');
    }
};
