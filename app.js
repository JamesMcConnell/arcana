var express = require('express'),
    routes = require('./routes'),
    DB = require('./config/db-config'),
    passport = require('passport'),
    mongoose = require('mongoose'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    flash = require('connect-flash');

var dbConn = 'mongodb://localhost/arcana';

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'arcana-session-store',
        key: 'express.sid'
    }, function () {
        app.use(app.router);
    }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.static(__dirname + '/public'));
});

var db = new DB.startup(dbConn);

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function (){
    app.use(express.errorHandler());
});

require('./routes')(app);
//io.sockets.on('connection', socket);
app.listen(3000);
console.log('Express server listening on port 3000 in %s mode', app.settings.env);
