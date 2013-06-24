var passport = require('passport'),
    main = require('./routes/index'),
    api = require('./routes/api');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    return res.redirect('/login');
}

function ensureAuthenticatedAndAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }

    return res.redirect('/login');
}

module.exports = function (app) {
    app.get('/', main.index);
    app.get('/session', main.session);
    app.get('/login', main.getLogin);
    app.post('/login', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.json(200, { success: false, message: info.message });
            }

            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }

                return res.json(200, { success: true });
            });
        })(req, res, next);
    });
    app.get('/register', main.getRegister);
    app.post('/register', main.postRegister);
    app.get('/logout', main.logout);
    app.get('/lobby', ensureAuthenticated, main.lobby);
    app.get('/admin/users', ensureAuthenticatedAndAdmin, main.adminUsers);

    app.get('/api/users', ensureAuthenticatedAndAdmin, api.getUsers);
    app.post('/api/users', ensureAuthenticatedAndAdmin, api.postUser);
    app.put('/api/users/:userId', ensureAuthenticatedAndAdmin, api.putUser);
    app.get('/api/users/:userId', ensureAuthenticatedAndAdmin, api.getUser);
};


