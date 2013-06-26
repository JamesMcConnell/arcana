var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RoomSchema = new Schema({
    roomName: { type: String, required: true, unique: true },
    numPlayers: { type: Number, required: true }
});

module.exports = mongoose.model('Room', RoomSchema);