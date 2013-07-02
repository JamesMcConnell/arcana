var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Card = require('../models/card');

module.exports = {
    saveCard: function (cardInfo, callback) {
        var newCard = new Card({
            cardName: cardInfo.cardName,
            cardType: cardInfo.cardType,
            instanceCost: cardInfo.instanceCost,
            maintenanceCost: cardInfo.maintenanceCost,
            burnValue: cardInfo.burnValue,
            genValue: cardInfo.genValue,
            health: cardInfo.health,
            power: cardInfo.power
        });

        newCard.save(function (err) {
            if (err) {
                if (err.code === 11000) {
                    callback(true, null, { message: 'Duplicate card name' });
                }
            } else {
                callback(null, newCard, null);
            }
        });
    },
    updateCard: function (cardId, card, callback) {
        Card.findOneAndUpdate({ _id: cardId }, card, function (err) {
            if (err) {
                callback(true, err);
            } else {
                callback(false, '');
            }
        });
    },
    getCard: function (cardId, callback) {
        Card.findById(cardId).exec(function (err, card) {
            if (err) {
                return callback(true, null, { message: 'Unable to retrieve card' });
            }

            callback(false, card, null);
        });
    },
    getCards: function (isPaged, currentPage, numPerPage, cardType, callback) {
        if (!isPaged) {
            var query = Card.find().sort('cardName');
            if (cardType && cardType.length > 0) {
                query.where('cardType').equals(cardType);
            }
            query.exec(function (err, cardList) {
                if (err) {
                    return callback(true, null, { message: 'Unable to retrieve cards' });
                }

                var reply = {
                    cards: cardList
                };
                callback(false, reply, null);
            });
        } else {
            var count = 0;
            var cardList = [];
            var pages = 1;
            var skip = (currentPage - 1) * numPerPage;

            var countQuery = Card.find().count();
            if (cardType && cardType.length > 0) {
                countQuery.where('cardType').equals(cardType);
            }
            countQuery.exec(function (err, num) {
                count = num;
                if (count > 1) {
                    pages = Math.ceil(count / numPerPage);
                }

                var listQuery = Card.find().sort('cardName').skip(skip).limit(numPerPage);
                listQuery.exec(function (err, cardList) {
                    if (err) {
                        return callback(true, null, { message: 'Unable to retrieve cards' });
                    }

                    var reply = {
                        currentPage: currentPage,
                        pages: pages,
                        cards: cardList
                    };
                    callback(false, reply, null);
                });
            });
        }
    }
};