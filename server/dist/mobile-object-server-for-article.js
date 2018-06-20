"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
// import {Observable} from 'rxjs';
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
const sockets_1 = require("./sockets");
var MobileObjectCommand;
(function (MobileObjectCommand) {
    MobileObjectCommand["TURN_ON"] = "turnOn";
    MobileObjectCommand["TURN_OFF"] = "turnOff";
    MobileObjectCommand["ACCELERATE_X"] = "accelerateX";
    MobileObjectCommand["ACCELERATE_Y"] = "accelerateY";
    MobileObjectCommand["BRAKE"] = "brake";
})(MobileObjectCommand = exports.MobileObjectCommand || (exports.MobileObjectCommand = {}));
var MessageType;
(function (MessageType) {
    // Inbound Messages sent by Monitor
    MessageType["BIND_MONITOR"] = "bind-monitor";
    // Inbound Messages sent by Controller
    MessageType["BIND_CONTROLLER"] = "bind-controller";
    MessageType["CONTROLLER_COMMAND"] = "command";
    // Outbound Messages sent to Monitor
    MessageType["MOBILE_OBJECT"] = "mobobj";
    MessageType["MOBILE_OBJECT_REMOVED"] = "mobobj-removed";
    MessageType["DYNAMICS_INFO"] = "dynamics";
    // Outbound Messages sent to Controller
    MessageType["TURNED_ON"] = "turnedOn";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class MobileObjectServer {
    constructor() {
        this.mobileObjects = new Map();
        this.mobileObjectCounter = 1;
        // private monitorCounter = 1;
        this.mobileObjectAdded = new rxjs_3.Subject();
        this.mobileObjectRemoved = new rxjs_3.Subject();
    }
    // first snippet
    startSocketServer1(httpServer) {
        sockets_1.sockets(httpServer, this.port).pipe(operators_4.mergeMap(socket => rxjs_2.race(socket.onMessageType(MessageType.BIND_MONITOR)
            .pipe(operators_2.map(() => (socketObs) => this.handleMonitorObs1(socketObs))), socket.onMessageType(MessageType.BIND_CONTROLLER)
            .pipe(operators_2.map(() => (socketObs) => this.handleControllerObs1(socketObs))))
            .pipe(operators_4.mergeMap(handler => handler(socket)))))
            .subscribe();
    }
    handleMonitorObs1(_socket) {
        const mobObjAdded = this.mobileObjectAdded
            .pipe(operators_4.mergeMap(data => data.mobObj.dynamicsObs));
        const mobObjRemoved = this.mobileObjectRemoved;
        return rxjs_1.merge(mobObjAdded, mobObjRemoved);
    }
    // END of first snippet
    // SECOND snippet
    startSocketServer2(httpServer) {
        sockets_1.sockets(httpServer, this.port).pipe(operators_4.mergeMap(socket => rxjs_2.race(socket.onMessageType(MessageType.BIND_MONITOR)
            .pipe(operators_2.map(() => (socketObs) => this.handleMonitorObs2(socketObs))), socket.onMessageType(MessageType.BIND_CONTROLLER)
            .pipe(operators_2.map(() => (socketObs) => this.handleControllerObs2(socketObs))))
            .pipe(operators_4.mergeMap(handler => handler(socket)))))
            .subscribe();
    }
    handleMonitorObs2(socket) {
        const mobObjAdded = this.mobileObjectAdded
            .pipe(operators_1.tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)), operators_4.mergeMap(mobObjInfo => mobObjInfo.mobObj.dynamicsObs
            .pipe(operators_1.tap(dynamics => socket.send(MessageType.DYNAMICS_INFO, dynamics)))));
        const mobObjRemoved = this.mobileObjectRemoved
            .pipe(operators_1.tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED, mobObjId)));
        return rxjs_1.merge(mobObjAdded, mobObjRemoved);
    }
    handleControllerObs2(socket) {
        const { mobObj, mobObjId } = this.newMobileObject();
        this.mobileObjectAdded.next({ mobObj, mobObjId });
        const commands = socket.onMessageType(MessageType.CONTROLLER_COMMAND)
            .pipe(operators_1.tap(command => this.execute(command, mobObj)));
        const disconnect = socket.onDisconnect()
            .pipe(operators_1.tap(() => this.mobileObjectRemoved.next(mobObjId)));
        return rxjs_1.merge(commands, disconnect);
    }
    // Fake methods to avoid issues in VSCode
    newMobileObject() {
        return { mobObj: new mobile_object_1.MobileObject(), mobObjId: 'abc' };
    }
    execute(_command, _mobObj) {
    }
    // end of SECOND snippet
    // THIRD snippet
    startSocketServer(httpServer) {
        sockets_1.sockets(httpServer, this.port).pipe(operators_4.mergeMap(socket => rxjs_2.race(socket.onMessageType(MessageType.BIND_MONITOR)
            .pipe(operators_2.map(() => (socketObs) => this.handleMonitorObs(socketObs))), socket.onMessageType(MessageType.BIND_CONTROLLER)
            .pipe(operators_2.map(() => (socketObs) => this.handleControllerObs(socketObs))))
            .pipe(operators_4.mergeMap(handler => handler(socket)))))
            .subscribe();
    }
    handleMonitorObs(socket) {
        const mobObjAdded = this.mobileObjectAdded
            .pipe(operators_1.tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)), operators_4.mergeMap(mobObjInfo => mobObjInfo.mobObj.dynamicsObs
            .pipe(operators_1.tap(dynamics => socket.send(MessageType.DYNAMICS_INFO, dynamics)), operators_6.takeUntil(this.stopSendDynamicsInfo(socket, mobObjInfo.mobObjId)))));
        const mobObjRemoved = this.mobileObjectRemoved
            .pipe(operators_1.tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED, mobObjId)));
        return rxjs_1.merge(mobObjAdded, mobObjRemoved);
    }
    handleControllerObs(socket) {
        const { mobObj, mobObjId } = this.newMobileObject();
        this.mobileObjectAdded.next({ mobObj, mobObjId });
        const commands = socket.onMessageType(MessageType.CONTROLLER_COMMAND)
            .pipe(operators_1.tap(command => this.execute(command, mobObj)));
        const disconnect = socket.onDisconnect()
            .pipe(operators_1.tap(() => this.mobileObjectRemoved.next(mobObjId)));
        return rxjs_1.merge(commands, disconnect);
    }
    stopSendDynamicsInfo(socket, mobObjId) {
        return rxjs_1.merge(this.mobileObjectRemoved.pipe(operators_5.filter(id => id === mobObjId)), socket.onDisconnect());
    }
    // end of THIRD snippet
    // private handleDynamicsObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string, monitorId: string,
    //                                 stopSend: Observable<any>,) {
    //     return mobObj.dynamicsObs
    //     .pipe(
    //         tap(data => socket.send(MessageType.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
    //         takeUntil(stopSend),
    //         finalize(() => console.log('sendDynamicsInfo completed', mobObjId, monitorId))
    //     );
    // }
    handleControllerObs1(socket) {
        const mobObjId = 'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new mobile_object_1.MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        console.log('mobObj added', mobObjId);
        socket.send(MessageType.MOBILE_OBJECT, mobObjId);
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        this.mobileObjectAdded.next({ mobObj, mobObjId });
        const commands = this.handleControllerCommandsObs(socket, mobObj, mobObjId);
        const turnOn = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);
        const disconnect = socket.onDisconnect()
            .pipe(operators_1.tap(() => console.log('Controller disconnected ' + mobObjId)), operators_1.tap(() => this.mobileObjects.delete(mobObjId)), operators_1.tap(
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        () => this.mobileObjectRemoved.next(mobObjId)));
        return rxjs_1.merge(commands, turnOn, disconnect);
    }
    handleControllerCommandsObs(socket, mobObj, mobObjId) {
        return socket.onMessageType(MessageType.CONTROLLER_COMMAND)
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
        }), operators_6.takeUntil(socket.onDisconnect()), operators_3.finalize(() => console.log('handleControllerCommandsObs completed', mobObjId)));
    }
    sendTurnedOnInfoObs(socket, mobObj, mobObjId) {
        return mobObj.isTurnedOnObs.pipe(operators_1.tap(isOn => console.log('MobObj: ' + mobObjId + 'isTurnedOnObs: ' + isOn)), operators_1.tap(isOn => socket.send(MessageType.TURNED_ON + mobObjId, JSON.stringify(isOn))), operators_6.takeUntil(socket.onDisconnect()), operators_3.finalize(() => console.log('sendTurnedOnInfo completed', mobObjId)));
    }
    // stream of dynamics data should be stopped if either the MobileObject is removed or if the socket is disconnected
    // the socket can either between the server and the controller of the MobileObject or between the server and the Monitor
    // private stopSendDynamicsInfo(socket: SocketObs, mobObjId: string) {
    //     return merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onDisconnect());
    // }
    getApp() {
        return this.app;
    }
    // added to allow tests
    getMobileObject(id) {
        return this.mobileObjects.get(id);
    }
    getMobileObjects() {
        return this.mobileObjects;
    }
}
MobileObjectServer.PORT = 8081;
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=mobile-object-server-for-article.js.map