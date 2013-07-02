var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CardSchema = new Schema({
    cardName: { type: String, required: true, unique: true },
    cardType: { type: String, required: true, enum: ['Battery', 'Creature', 'Buff', 'Debuff', 'Sorcery']},
    instanceCost: { type: Number, required: true },
    maintenanceCost: { type: Number, required: true },
    burnValue: { type: Number, required: true },
    genValue: { type: Number, required: true },
    health: { type: Number },
    power: { type: Number }
});

module.exports = mongoose.model('Card', CardSchema);