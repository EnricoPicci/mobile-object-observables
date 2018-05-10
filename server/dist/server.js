"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
// import socketIo from 'socket.io';  THIS IMPORT DOES NOT WORK
const mobile_object_1 = require("./mobile-object/mobile-object");
const operators_1 = require("rxjs/operators");
var MobileObjectCommand;
(function (MobileObjectCommand) {
    MobileObjectCommand["ACCELERATE_X"] = "accelerateX";
    MobileObjectCommand["ACCELERATE_Y"] = "accelerateY";
    MobileObjectCommand["BRAKE"] = "brake";
})(MobileObjectCommand = exports.MobileObjectCommand || (exports.MobileObjectCommand = {}));
class MobileObjectServer {
    constructor(showDynamics = true) {
        this.showDynamics = showDynamics;
        this.mobileObject = new mobile_object_1.MobileObject();
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        if (this.showDynamics) {
            this.mobileObject.deltaSpaceObsX
                .pipe(operators_1.throttleTime(500))
                .subscribe(d => console.log('X : ', d.cumulatedSpace, 'vel X :', d.vel));
        }
    }
    createApp() {
        this.app = express();
    }
    createServer() {
        this.server = http_1.createServer(this.app);
    }
    config() {
        this.port = process.env.PORT || MobileObjectServer.PORT;
    }
    sockets() {
        this.io = socketIo(this.server);
    }
    listen() {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
        this.io.on('connect', (socket) => {
            console.log('Connected client on port %s.', this.port);
            socket.on('message', m => {
                const commandMessage = m.message;
                console.log('[server](message): %s', JSON.stringify(m));
                this.io.emit('message', commandMessage);
                console.log(commandMessage);
                if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
                    this.mobileObject.accelerateX(commandMessage.value);
                }
                else if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
                    this.mobileObject.accelerateY(commandMessage.value);
                }
                else if (commandMessage.action === MobileObjectCommand.BRAKE) {
                    this.mobileObject.brake();
                }
                else {
                    console.error('message not supported', commandMessage);
                }
            });
            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }
    getApp() {
        return this.app;
    }
}
MobileObjectServer.PORT = 8081;
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server.js.map