/*
    Use this script to place load against the messaging API.
    To start the test run:
    docker run -i loadimpact/k6 run - <LoadTest.js
*/

import { check, sleep } from 'k6';
import http from 'k6/http';
import ws from 'k6/ws';

const ip = '192.168.1.36';
const churchId = "Q5EjNf69beb";
const conversationId = "u2dFEMSrd2I";
const restUrl = 'http://' + ip + ':8086';
const wsUrl = 'ws://' + ip + ':8087';


export let options = {
    stages: [
        { duration: '5s', target: 2 },
        { duration: '5s', target: 10 },
        { duration: '20s', target: 50 },
        /*
        { duration: '30s', target: 250 },
        { duration: '60s', target: 1000 },
        { duration: '60s', target: 1000 },
        { duration: '30s', target: 250 },
        */
        { duration: '60s', target: 50 },
        { duration: '5s', target: 0 },
    ],
};

var socketId = '';

export default function () {

    const res = ws.connect(wsUrl, {}, function (socket) {
        socket.on('open', () => {
            console.log('connected')
            socket.send("getId");
        });
        socket.on('message', (raw) => {
            const data = JSON.parse(raw);
            //console.log('Message received: ', raw)

            if (data.action === 'socketId') {
                socketId = data.data;
                joinRoom();
            }
        });
        socket.on('close', () => console.log('disconnected'));
        socket.setTimeout(function () {
            console.log('60 seconds passed, closing the socket');
            socket.close();
        }, 60 * 1000);
        socket.setInterval(checkSendMessage, 1000);
    });
}

const joinRoom = () => {
    const connection = { conversationId: conversationId, churchId: churchId, displayName: "TestUser", socketId: socketId }
    postAnonymous("/connections", [connection]);
}

const checkSendMessage = () => {
    const num = Math.floor(Math.random() * 250); //With 100 connection on average one of them will send a message every 1 seconds.
    if (num === 1) {
        const num2 = Math.floor(Math.random() * 5000)
        const msg = { churchId: churchId, content: "Hello", conversationId: conversationId, displayName: "Anonymous " + num2.toString(), messageType: "message" };
        postAnonymous("/messages/send", [msg]);
    }

}

const postAnonymous = (path, data) => {
    const options = { headers: { 'Content-Type': 'application/json' }, };
    return http.post(restUrl + path, JSON.stringify(data), options);
}
