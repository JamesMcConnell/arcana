module.exports = function (app) {
    var mongoose = require('mongoose');
    var Table = require('../models/table');

    app.get('/tables', function (req, res) {
        var count = 0;
        var currentPage = parseInt(req.query.currentPage) || 1;
        var tableList = [];
        var numPerPage = parseInt(req.query.numPerPage) || 10;
        var pages = 1;
        var skip = (currentPage -1) * numPerPage;

        Table.find().count().exec(function (err, num) {
            count = num;
            if (count > 1) {
                pages = Math.ceil(count / numPerPage);
            }

            Table.find(req.query.query)
                .sort('name')
                .skip(skip)
                .limit(numPerPage)
                .exec(function (err, tableList) {
                    var reply = {
                        currentPage: currentPage,
                        pages: pages,
                        tables: tableList
                    };

                    res.header("Cache-Control", "no-cache", "must-revalidate");
                    res.header("Pragma", "no-cache");
                    res.header("Expires", 0);
                    res.send(reply);
                });
        });
    });

    app.get('/tables/:id', function (req, res) {
        User.findOne({ _id: req.params.id }, function (err, result) {
            if (err) {
                console.log(err);
            }

            if (result) {
                res.send(result);
            }
        });
    });

    app.put('/tables/:id', function (req, res) {
        Table.update({ _id: req.params.id}, req.body, function (err) {
            if (err) {
                return res.send({ status: 'error', message: err });
            }

            res.send({ status: 'success' });
        })
    })
}
