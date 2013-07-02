var cardDb = require('../../data/card');

module.exports = {
    getCards: function (req, res) {
        cardDb.getCards(req.param('isPaged'), req.param('currentPage'), req.param('numPerPage'), req.param('cardType'), function (err, reply, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: reply, message: null });
            }
        });
    },
    getCard: function (req, res) {
        cardDb.getCard(req.param('cardId'), function (err, card, info) {
            if (err) {
                return res.json(200, { success: false, result: null, message: info.message });
            } else {
                return res.json(200, { success: true, result: card, message: null });
            }
        });
    },
    postCard: function (req, res) {
        cardDb.saveCard({
            cardName: req.param('cardName'),
            cardType: req.param('cardType'),
            instanceCost: req.param('instanceCost'),
            maintenanceCost: req.param('maintenanceCost'),
            burnValue: req.param('burnValue'),
            genValue: req.param('genValue'),
            health: req.param('health'),
            power: req.param('power')
        }, function (err, card, info) {
            if (err) {
                return res.json(200, { success: false, card: null, message: info.message });
            } else {
                return res.json(200, { success: true, card: card, message: null });
            }
        });
    },
    putCard: function (req, res) {
        var cardId = req.param('cardId');
        var cardObj = {
            cardName: req.body.cardName,
            cardType: req.body.cardType,
            instanceCost: req.body.instanceCost,
            maintenanceCost: req.body.maintenanceCost,
            burnValue: req.body.burnValue,
            genValue: req.body.genValue,
            health: req.body.health,
            power: req.body.power
        };
        cardDb.updateCard(cardId, cardObj, function (err, message) {
            if (err) {
                return res.json(200, { success: false, message: message });
            } else {
                return res.json(200, { success: true, message: '' });
            }
        });
    }
};