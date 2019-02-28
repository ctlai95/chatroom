var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path');

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);

        io.emit('chat message',
            JSON.stringify({
                message: msg,
                timestamp: getTimeStamp(),
            })
        );
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});


function getTimeStamp() {
    var dateWithouthSecond = new Date();
    return dateWithouthSecond.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}
