var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passport = require('passport'),
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: true }
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
                return next(err);
            }

            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (candidatePassword, next) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) {
            return next(err);
        }

        next(null, isMatch);
    });
};

UserSchema.static('authenticate', function (username, password, callback) {
    this.findOne({ username: username }, function (err, user) {
        if (err) {
            return callback(err);
        }

        if (!user) {
            return callback(null, false);
        }

        user.comparePassword(password, function (err, isCorrect) {
            if (err) {
                return callback(err);
            }

            if (!isCorrect) {
                return callback(null, false, { message: 'Invalid username or password' });
            }

            return callback(null, user);
        });
    });
});

module.exports = mongoose.model('User', UserSchema);

