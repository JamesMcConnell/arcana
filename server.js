var express = require('express'),
    passport = require('passport'),
    io = require('socket.io');

var app = express(),
    server = require('http').createServer(app),
    io = io.listen(server);

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.cookieParser());
    app.use(express.bodyParser());

    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'arcana-session-store',
        key: 'express.sid'
    }, function () {
        app.use(app.router);
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/public'));
});

var DB = require('./config/db-config');
var db = {};

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    db = new DB.startup('mongodb://localhost/arcana');
});

app.configure('production', function (){
    app.use(express.errorHandler());
    db = new DB.startup('mongodb://interneth3ro:jm71cl33@ds031108.mongolab.com:31108/MongoLab-u')
});

io.configure(function () {
    io.enable('browser client minification');
    io.set('log level', 1);
});

// Changing file to verify I can check in from this machine.

require('./routes')(app, io);
require('./sockets')(app, io);
server.listen(3000);
console.log('Express server listening on port 3000 in %s mode', app.settings.env);
