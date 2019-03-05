var generateName = require('sillyname');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var path = require('path');
var namesList = {};
var chatHistory = [];

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    namesList[socket.id] = generateName();
    socket.emit('nickname', namesList[socket.id]);
    for (i = 0; i < chatHistory.length; i++) {
        socket.emit('chat message', chatHistory[i]);
    }

    console.log(`${namesList[socket.id]} connected`)
    io.emit('user list', namesList);

    socket.on('disconnect', function () {
        console.log(`${namesList[socket.id]} disconnected`)
        delete namesList[socket.id];
        io.emit('user list', namesList);
    });
    socket.on('chat message', function (msg) {
        let jsonMsg = JSON.stringify({
            nickname: namesList[socket.id],
            message: msg,
            timestamp: getTimeStamp(),
        });
        console.log(jsonMsg);

        saveMessage(jsonMsg);
        io.emit('chat message', jsonMsg);
    });

    socket.on('name change', function (name) {
        if (nameExists(name)) {
            console.log(`Username "${name}" taken`);
            socket.emit('username taken', name);
            return;
        }
        console.log(`${namesList[socket.id]} changed their name to ${name}`);
        namesList[socket.id] = name;
        io.emit('user list', namesList);
        socket.emit('nickname', namesList[socket.id]);
    })
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

function saveMessage(msg) {
    if (chatHistory.length >= 200) {
        chatHistory.shift();
    }

    chatHistory.push(msg);
}

function nameExists(name) {
    for (var key in namesList) {
        if (name === namesList[key]) {
            return true;
        }
    }
    return false;
}
