var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs')

var UserSchema = new Schema({
    username: { type: String, required: true, index: { unique: true }},
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    password: { type: String, required: true },
    isAdmin: { type: Boolean }
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }

    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return next(err);
        }

        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
                console.log('hash failed');
                return next(err);
            }

            console.log('hash generated: ' + hash);
            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.comparePassword = function (thePassword, fn) {
    bcrypt.compare(thePassword, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        fn(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);
