var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path');
var nicknames = {};
var chatHistory = [];

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    nicknames[socket.id] = getUniqueNickname();
    socket.emit('nickname', nicknames[socket.id]);
    for (i = 0; i < chatHistory.length; i++) {
        socket.emit('chat message', chatHistory[i]);
    }

    console.log(nicknames[socket.id] + " connected");
    socket.on('disconnect', function () {
        console.log(nicknames[socket.id] + " disconnected");
    });
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg);

        let jsonMsg = JSON.stringify({
            nickname: nicknames[socket.id],
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
    return "User" + Object.keys(nicknames).length;
}

function saveMessage(msg) {
    if (chatHistory.length >= 200) {
        chatHistory.shift();
    }

    chatHistory.push(msg);
    console.log(chatHistory);
}
