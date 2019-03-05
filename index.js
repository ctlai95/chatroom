var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path');
var nicknames = require('nicknames');
var namesList = {};
var chatHistory = [];

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    namesList[socket.id] = getUniqueNickname();
    socket.emit('nickname', namesList[socket.id]);
    for (i = 0; i < chatHistory.length; i++) {
        socket.emit('chat message', chatHistory[i]);
    }

    console.log(namesList[socket.id] + " connected");
    io.emit('user list', namesList);

    socket.on('disconnect', function () {
        console.log(namesList[socket.id] + " disconnected");
        delete namesList[socket.id];
        io.emit('user list', namesList);
    });
    socket.on('chat message', function (msg) {
        let jsonMsg = JSON.stringify({
            nickname: namesList[socket.id],
            message: msg,
            timestamp: getTimeStamp(),
        })

        saveMessage(jsonMsg);
        io.emit('chat message', jsonMsg);
    });
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});

function getTimeStamp() {
    let dateWithouthSecond = new Date();
    return dateWithouthSecond.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function getUniqueNickname() {
    return nicknames.allRandom();
}

function saveMessage(msg) {
    if (chatHistory.length >= 200) {
        chatHistory.shift();
    }

    chatHistory.push(msg);
}
