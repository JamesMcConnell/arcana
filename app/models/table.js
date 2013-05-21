var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TableSchema = new Schema({
    name: { type: String },
    isPrivate: { type: Boolean },
    hasUsers: { type: Boolean },
    seats: [seatSchema]
});

var seatSchema = new Schema({
    username: { type: String }
});

module.exports = mongoose.model('Table', TableSchema);
