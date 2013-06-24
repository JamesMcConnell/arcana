var mongoose = require('mongoose');

module.exports = {
    startup: function (dbConn) {
        mongoose.connect(dbConn);
        mongoose.connection.on('open', function () {
            console.log('Connected to MongoDB');
        });
    }
};
