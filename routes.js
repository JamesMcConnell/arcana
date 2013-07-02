var passport = require('passport'),
    main = require('./routes/index'),
    userApi = require('./routes/api/userApi'),
    roomApi = require('./routes/api/roomApi'),
    tableApi = require('./routes/api/tableApi'),
    cardApi = require('./routes/api/cardApi');

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
    app.get('/admin/rooms', ensureAuthenticatedAndAdmin, main.adminRooms);
    app.get('/admin/tables', ensureAuthenticatedAndAdmin, main.adminTables);
    app.get('/admin/cards', ensureAuthenticatedAndAdmin, main.adminCards);

    app.get('/api/users', ensureAuthenticatedAndAdmin, userApi.getUsers);
    app.get('/api/users/:userId', ensureAuthenticated, userApi.getUser);
    app.post('/api/users', ensureAuthenticatedAndAdmin, userApi.postUser);
    app.put('/api/users/:userId', ensureAuthenticatedAndAdmin, userApi.putUser);

    app.get('/api/rooms', ensureAuthenticated, roomApi.getRooms);
    app.get('/api/rooms/:roomId', ensureAuthenticated, roomApi.getRoom);
    app.post('/api/rooms', ensureAuthenticatedAndAdmin, roomApi.postRoom);
    app.put('/api/rooms/:roomId', ensureAuthenticatedAndAdmin, roomApi.putRoom);

    app.get('/api/tables', ensureAuthenticated, tableApi.getTables);
    app.get('/api/tables/:tableId', ensureAuthenticated, tableApi.getTable);
    app.post('/api/tables', ensureAuthenticatedAndAdmin, tableApi.postTable);
    app.put('/api/tables/:tableId', ensureAuthenticatedAndAdmin, tableApi.putTable);

    app.get('/api/cards', ensureAuthenticated, cardApi.getCards);
    app.get('/api/cards/:cardId', ensureAuthenticated, cardApi.getCard);
    app.post('/api/cards', ensureAuthenticatedAndAdmin, cardApi.postCard);
    app.put('/api/cards/:cardId', ensureAuthenticatedAndAdmin, cardApi.putCard);
};


