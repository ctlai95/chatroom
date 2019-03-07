const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const express = require('express');
const path = require('path');
const cookie = require('cookie');
const generateName = require('sillyname');

var namesList = [];
var chatHistory = [];
var colors = {};

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    let userCookie = socket.handshake.headers.cookie;
    let username = ((userCookie != null) ? cookie.parse(userCookie).name : generateName());

    namesList.push(username);

    socket.emit('nickname', username);
    for (i = 0; i < chatHistory.length; i++) {
        socket.emit('chat message', chatHistory[i]);
    }

    console.log(`${username} connected`);
    io.emit('user list', namesList);

    if (!username in colors) {
        colors[username] = '#ffffff';
    }

    socket.on('disconnect', function () {
        console.log(`${username} disconnected`)
        removeByValue(namesList, username);
        io.emit('user list', namesList);
    });
    socket.on('chat message', function (msg) {
        let jsonMsg = JSON.stringify({
            nickname: username,
            message: msg,
            timestamp: getTimeStamp(),
            color: colors[username],
        });
        console.log(jsonMsg);

        saveMessage(jsonMsg);
        io.emit('chat message', jsonMsg);
    });

    socket.on('name change', function (name) {
        if (namesList.indexOf(name) !== -1) {
            console.log(`Username "${name}" taken`);
            socket.emit('username taken', name);
            return;
        }
        console.log(`${username} changed their name to ${name}`);
        namesList[namesList.indexOf(username)] = name;
        colors[name] = colors[username];
        delete colors[username];
        username = name;
        io.emit('user list', namesList);
        socket.emit('nickname', username);
    });

    socket.on('color change', function (color) {
        if (/(^[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color)) {
            color = '#' + color;
        }
        colors[username] = color;
        console.log(`${username} changed their color to ${color}`);
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

function saveMessage(msg) {
    if (chatHistory.length >= 200) {
        chatHistory.shift();
    }

    chatHistory.push(msg);
}

function removeByValue(arr, val) {
    let index = arr.indexOf(val);
    if (index !== -1) {
        arr.splice(index, 1);
    }
}
