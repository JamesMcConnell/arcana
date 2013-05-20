var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TableSchema = new Schema({
    name: { type: String },
    isPrivate: { type: Boolean },
    hasUsers: { type: Boolean },
    seatOne: {
        user: { type: String }
    },
    seatTwo: {
        user: { type: String }
    },
    seatThree: {
        user: { type: String }
    },
    seatFour: {
        user: { type: String }
    }
});

module.exports = mongoose.model('Table', TableSchema);
