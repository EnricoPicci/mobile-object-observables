"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
const rxjs_1 = require("rxjs");
const mobile_object_1 = require("./mobile-object/mobile-object");
const operators_1 = require("rxjs/operators");
var MobileObjectCommand;
(function (MobileObjectCommand) {
    MobileObjectCommand["ACCELERATE_X"] = "accelerateX";
    MobileObjectCommand["ACCELERATE_Y"] = "accelerateY";
    MobileObjectCommand["BRAKE"] = "brake";
})(MobileObjectCommand = exports.MobileObjectCommand || (exports.MobileObjectCommand = {}));
class MobileObjectServer {
    constructor() {
        // private dynamicsNamespace: string;
        this.mobileObject = new mobile_object_1.MobileObject();
        this.throttleTime = 1000;
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        this.showDynamics(true);
    }
    createApp() {
        this.app = express();
    }
    createServer() {
        this.server = http_1.createServer(this.app);
    }
    config() {
        this.port = process.env.PORT || MobileObjectServer.PORT;
        // this.dynamicsNamespace = process.env.DYNAMICSNSP || MobileObjectServer.DYNAMICS_NAMESPACE;
    }
    sockets() {
        this.io = socketIo(this.server);
    }
    listen() {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
        // const dynamicsIo = this.io.of(this.dynamicsNamespace);
        this.io.on('connect', socket => {
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
            this.dynamicsSubscription = rxjs_1.zip(this.mobileObject.deltaSpaceObsX, this.mobileObject.deltaSpaceObsY)
                .subscribe(data => {
                socket.emit('dynamics', JSON.stringify(data));
            });
            socket.on('disconnect', () => {
                console.log('Controller client disconnected');
                this.dynamicsSubscription.unsubscribe();
            });
        });
    }
    getApp() {
        return this.app;
    }
    showDynamics(bool) {
        if (bool) {
            this.showDynamicsSubscriptionX = this.mobileObject.deltaSpaceObsX
                .pipe(operators_1.throttleTime(this.throttleTime))
                .subscribe(d => console.log('X : ', d.cumulatedSpace, 'vel X :', d.vel));
            this.showDynamicsSubscriptionY = this.mobileObject.deltaSpaceObsY
                .pipe(operators_1.throttleTime(this.throttleTime))
                .subscribe(d => console.log('Y : ', d.cumulatedSpace, 'vel Y :', d.vel));
        }
        else {
            if (this.showDynamicsSubscriptionX) {
                this.showDynamicsSubscriptionX.unsubscribe();
            }
            if (this.showDynamicsSubscriptionY) {
                this.showDynamicsSubscriptionY.unsubscribe();
            }
        }
    }
}
MobileObjectServer.PORT = 8081;
MobileObjectServer.DYNAMICS_NAMESPACE = '/dynamicsInfo';
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server.js.map