var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var SeatSchema = new Schema({
    username: { type: String },
    position: { type: Number }
});

var TableSchema = new Schema({
    tableName: { type: String, required: true, unique: true },
    roomName: { type: String, required: true },
    seats: [SeatSchema],
    status: { type: String, enum: ['Open', 'In Progress', 'Closed']}
});

module.exports = mongoose.model('Table', TableSchema);