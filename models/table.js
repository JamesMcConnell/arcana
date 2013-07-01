var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TableSchema = new Schema({
    tableName: { type: String, required: true, unique: true },
    roomName: { type: String, required: true },
    seats: [{
        username: { type: String },
        position: { type: Number }
    }],
    status: { type: String, enum: ['Open', 'In Progress', 'Closed']}
});

module.exports = mongoose.model('Table', TableSchema);