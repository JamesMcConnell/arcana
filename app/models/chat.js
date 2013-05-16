var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ChatSchema = new Schema({
    user: { type: String, required: true },
    body: { type: String },
    timestamp: { type: Number }
});

module.exports = mongoose.model('Chat', ChatSchema);
