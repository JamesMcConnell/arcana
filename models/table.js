var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SeatSchema = new Schema({
    username: { type: String },
    position: { type: Number },
    isLeader: { type: Boolean }
});

var TableSchema = new Schema({
    tableName: { type: String, required: true, unique: true },
    roomName: { type: String, required: true },
    seats: [SeatSchema],
    status: { type: String, enum: ['Open', 'In Progress', 'Closed']},
    hasLeader: { type: Boolean }
});

module.exports = mongoose.model('Table', TableSchema);