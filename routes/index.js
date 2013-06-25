var db = require('../config/db-config');

module.exports = {
    index: function (req, res) {
        res.render('index.jade', {
            pageTitle: 'Arcana'
        });
    },
    session: function (req, res) {
        if (req.user) {
            return res.json(200, { user: req.user });
        } else {
            return res.json(200, { user: {} });
        }
    },
    getRegister: function (req, res) {
        res.render('register.jade', {
            pageTitle: 'Register User'
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
            pageTitle: 'Lobby'
        });
    },
    adminUsers: function (req, res) {
        res.render('admin-users.jade', {
            pageTitle: 'User Administration'
        });
    },
    getLogin: function (req, res) {
        res.render('login.jade', {
            pageTitle: 'Login'
        });
    },
    logout: function (req, res) {
        req.logout();
        res.redirect('/');
    }
};
