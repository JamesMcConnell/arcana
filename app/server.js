var express = require('express'),
    io = require('socket.io'),
    mongoose = require('mongoose'),
    path = require('path');

var app = express(),
    server = require('http').createServer(app),
    io = io.listen(server);

mongoose.connect('localhost', 'arcana', function (err) {
    if (err) {
        return console.log(err);
    }
    console.log('Connected to MongoDB');
});

app.configure(function () {
    app.set('view', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.compress());
    app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }));
    app.use(express.cookieParser());
    app.use(express.cookieSession({ secret: 'scoobydoo'}))
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/../public'));

    app.use(function (req, res) {
        res.sendfile(path.normalize(__dirname + '/../public/index.html'));
    });
});

require('./routes')(app, io);
require('./controllers')(app, io);

var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log('Starting server on port ' + port);
});