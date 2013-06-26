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
    updateUser: function (userId, user, callback) {
        User.findOneAndUpdate({ _id: userId }, user, function (err) {
            if (err) {
                callback(true, err);
            } else {
                callback(false, '')
            }
        });
    },
    getUsers: function (fetchAll, currentPage, numPerPage, callback) {
        if (fetchAll) {
            User.find().sort('username').exec(function (err, userList) {
                if (err) {
                    return callback(true, null, { message: 'Unable to retrieve users' });
                }
                var reply = {
                    users: userList
                };
                callback(false, reply, null);
            });
        } else {
            var count = 0;
            var userList = [];
            var pages = 1;
            var skip = (currentPage - 1) * numPerPage;

            var countQuery = User.find();
            countQuery.count().exec(function (err, num) {
                count = num;
                if (count > 1) {
                    pages = Math.ceil(count / numPerPage);
                }

                var listQuery = User.find().sort('username').skip(skip).limit(numPerPage);
                listQuery.exec(function (err, userList) {
                    if (err) {
                        return callback(true, null, { message: 'Unable to retrieve users' });
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
    },
    getUser: function (userId, callback) {
        User.findById(userId).exec(function (err, user) {
            if (err) {
                return callback(true, null, { message: 'Unable to retrieve user' });
            }

            callback(false, user, null);
        });
    }
};