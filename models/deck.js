var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DeckSchema = new Schema({
    deckName: { type: String, required: true, unique: true },
    cards: [{ type: Schema.Types.ObjectId, ref: 'Card' }]
});

module.exports = mongoose.model('Deck', DeckSchema);