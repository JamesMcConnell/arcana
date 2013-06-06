var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    function (username, password, done) {
        User.authenticate(username, password, function (err, user, info) {
            return done(err, user, info);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

module.exports = {
    startup: function (dbConn) {
        mongoose.connect(dbConn);
        mongoose.connection.on('open', function () {
            console.log('Connected to MongoDB');
        });
    },
    saveUser: function (userInfo, callback) {
        var newUser = new User({
            username: userInfo.username,
            email: userInfo.email,
            password: userInfo.password,
            isAdmin: false
        });
        newUser.save(function (err){
            if (err) {
                if (err.code === 11000) {
                    callback(true, null, { message: 'Duplicate username or email.' });
                }
            } else {
                callback(null, newUser, null);
            }
        });
    },
    getPagedUsers: function (currentPage, numPerPage, callback) {
        var count = 0;
        var userList = [];
        var pages = 1;
        var skip = (currentPage - 1) * numPerPage;

        User.find().count().exec(function (err, num) {
            count = num;
            if (count > 1) {
                pages = Math.ceil(count / numPerPage);
            }

            User.find()
                .sort('username')
                .skip(skip)
                .limit(numPerPage)
                .exec(function (err, userList) {
                    if (err) {
                        callback(true, null, { message: 'Unable to retrieve users' });
                    }
                    var reply = {
                        currentPage: currentPage,
                        pages: pages,
                        users: userList
                    };

                    callback(false, reply, null);
                });
        });
    }
};
