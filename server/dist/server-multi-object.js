"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const rxjs_3 = require("rxjs");
const mobile_object_1 = require("./mobile-object/mobile-object");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
const operators_5 = require("rxjs/operators");
const operators_6 = require("rxjs/operators");
const socket_io_observable_1 = require("./socket-io-observable");
var MobileObjectCommand;
(function (MobileObjectCommand) {
    MobileObjectCommand["TURN_ON"] = "turnOn";
    MobileObjectCommand["TURN_OFF"] = "turnOff";
    MobileObjectCommand["ACCELERATE_X"] = "accelerateX";
    MobileObjectCommand["ACCELERATE_Y"] = "accelerateY";
    MobileObjectCommand["BRAKE"] = "brake";
})(MobileObjectCommand = exports.MobileObjectCommand || (exports.MobileObjectCommand = {}));
var Event;
(function (Event) {
    Event["CONNECT"] = "connect";
    Event["DISCONNECT"] = "disconnect";
    // Inbound Events sent by Monitor
    Event["BIND_MONITOR"] = "bind-monitor";
    // Inbound Events sent by Controller
    Event["BIND_CONTROLLER"] = "bind-controller";
    Event["CONTROLLER_COMMAND"] = "command";
    // Outbound Events sent to Monitor
    Event["MOBILE_OBJECT"] = "mobobj";
    Event["MOBILE_OBJECT_REMOVED"] = "mobobj-removed";
    Event["DYNAMICS_INFO"] = "dynamics";
    // Outbound Events sent to Controller
    Event["TURNED_ON"] = "turnedOn";
})(Event = exports.Event || (exports.Event = {}));
class MobileObjectServer {
    constructor() {
        this.mobileObjects = new Map();
        this.mobileObjectCounter = 1;
        this.monitorCounter = 1;
        this.mobileObjectAdded = new rxjs_3.Subject();
        this.mobileObjectRemoved = new rxjs_3.Subject();
        this.app = express();
        this.port = process.env.PORT || MobileObjectServer.PORT;
        this.server = http_1.createServer(this.app);
        this.listen();
    }
    listen() {
        socket_io_observable_1.connectServer(this.server, this.port).pipe(operators_1.tap(() => console.log('Connected client obs on port %s.', this.port)), operators_4.mergeMap(socketObs => rxjs_2.merge(socketObs.onEvent(Event.BIND_MONITOR)
            .pipe(operators_1.tap(() => 'BIND_MONITOR'), operators_4.mergeMap(() => this.handleMonitorObs(socketObs))), socketObs.onEvent(Event.BIND_CONTROLLER)
            .pipe(operators_1.tap(() => 'BIND_CONTROLLER'), operators_4.mergeMap(() => this.handleControllerObs(socketObs)))))).subscribe(null, console.error, () => console.log('really done'));
    }
    handleMonitorObs(socket) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        console.log('Monitor bound', monitorId);
        const mobObjAdded = rxjs_2.merge(rxjs_1.from(this.mobileObjects).pipe(operators_2.map(([mobObjId, mobObj]) => ({ mobObj, mobObjId }))), this.mobileObjectAdded)
            .pipe(operators_1.tap(mobObjInfo => console.log('handleMonitor mobileObject added ' + mobObjInfo.mobObjId + ' - Monitor: ' + monitorId)), operators_4.mergeMap(mobObjInfo => {
            socket.send(Event.MOBILE_OBJECT, mobObjInfo.mobObjId);
            return this.sendDynamicsInfoObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId, rxjs_2.merge(socket.onDisconnect(), this.mobileObjectRemoved.pipe(operators_5.filter(id => id === mobObjInfo.mobObjId))), monitorId);
        }), operators_6.takeUntil(socket.onDisconnect()), operators_3.finalize(() => console.log('Socket disconnected - Adding mobile objects completed for Monitor: ', monitorId)));
        const mobObjRemoved = this.mobileObjectRemoved
            .pipe(operators_1.tap(mobObjId => console.log('handleMonitor mobileObject removed ' + mobObjId + ' - Monitor: ' + monitorId)), operators_1.tap(mobObjId => socket.send(Event.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId)), operators_6.takeUntil(socket.onDisconnect()), operators_3.finalize(() => console.log('Socket disconnected - Removing mobile objects completed for Monitor: ', monitorId)));
        return rxjs_2.merge(mobObjAdded, mobObjRemoved);
    }
    sendDynamicsInfoObs(socket, mobObj, mobObjId, stopSend, monitorId) {
        return mobObj.dynamicsObs
            .pipe(operators_1.tap(data => socket.send(Event.DYNAMICS_INFO + mobObjId, JSON.stringify(data))), operators_6.takeUntil(stopSend), operators_3.finalize(() => console.log('sendDynamicsInfo completed', mobObjId, monitorId)));
    }
    handleControllerObs(socket) {
        const mobObjId = 'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new mobile_object_1.MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        console.log('mobObj added', mobObjId);
        socket.send(Event.MOBILE_OBJECT, mobObjId);
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        this.mobileObjectAdded.next({ mobObj, mobObjId });
        const commands = this.handleControllerCommandsObs(socket, mobObj, mobObjId);
        const turnOn = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);
        const disconnect = socket.onEvent(Event.DISCONNECT)
            .pipe(operators_1.tap(() => console.log('Controller disconnected ' + mobObjId)), operators_1.tap(() => {
            // with this Subject we have to communicate something happend on the Controller to the Monitor
            // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
            // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
            // so that it can notify the monitors, for which it behaves like an Observable, of its loss
            // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
            // we are using a property of the class MobileObjectServer
            this.mobileObjectRemoved.next(mobObjId);
            this.mobileObjects.delete(mobObjId);
        }));
        return rxjs_2.merge(commands, turnOn, disconnect);
    }
    handleControllerCommandsObs(socket, mobObj, mobObjId) {
        return socket.onEvent(Event.CONTROLLER_COMMAND)
            .pipe(operators_1.tap((commandMessage) => {
            if (commandMessage.action === MobileObjectCommand.TURN_ON) {
                console.log('TURN_ON', mobObjId);
                mobObj.turnOn();
            }
            else if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
                console.log('TURN_OFF', mobObjId);
                mobObj.turnOff();
            }
            else if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
                console.log('ACCELERATE_X', commandMessage, mobObjId);
                mobObj.accelerateX(commandMessage.value);
            }
            else if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
                console.log('ACCELERATE_Y', commandMessage, mobObjId);
                mobObj.accelerateY(commandMessage.value);
            }
            else if (commandMessage.action === MobileObjectCommand.BRAKE) {
                console.log('BRAKE', mobObjId);
                mobObj.brake();
            }
            else {
                console.error('command not supported', commandMessage);
            }
        }), operators_6.takeUntil(socket.onEvent(Event.DISCONNECT)));
    }
    sendTurnedOnInfoObs(socket, mobObj, mobObjId) {
        return mobObj.isTurnedOnObs.pipe(operators_1.tap(isOn => console.log('MobObj: ' + mobObjId + 'isTurnedOnObs: ' + isOn)), operators_1.tap(isOn => socket.send(Event.TURNED_ON + mobObjId, JSON.stringify(isOn))), operators_6.takeUntil(rxjs_2.merge(this.mobileObjectRemoved.pipe(operators_5.filter(id => id === mobObjId)), socket.onEvent(Event.DISCONNECT))), operators_3.finalize(() => console.log('sendTurnedOnInfo completed', mobObjId)));
    }
    getApp() {
        return this.app;
    }
}
MobileObjectServer.PORT = 8081;
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server-multi-object.js.map