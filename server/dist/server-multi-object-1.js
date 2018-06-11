"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
const rxjs_1 = require("rxjs");
// import {merge} from 'rxjs';
const rxjs_2 = require("rxjs");
const mobile_object_1 = require("./mobile-object/mobile-object");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
// import {connectServer} from './socket-io-observable';
// import {SocketObs} from './socket-io-observable';
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
        this.mobileObjectAdded = new rxjs_2.Subject();
        this.mobileObjectRemoved = new rxjs_2.Subject();
        this.app = express();
        this.port = process.env.PORT || MobileObjectServer.PORT;
        this.server = http_1.createServer(this.app);
        this.io = socketIo(this.server);
        this.listen();
    }
    listen() {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
        // connectServer(this.server, this.port).pipe(
        //     tap(() => console.log('Connected client on port %s.', this.port)),
        //     tap(socket => this.handleMonitorObs(socket)),
        //     tap(socket => this.handleControllerObs(socket)),
        // ).subscribe();
        this.io.on(Event.CONNECT, socket => {
            console.log('Connected client on port %s.', this.port);
            socket.on(Event.BIND_MONITOR, () => {
                console.log('Monitor bound');
                this.handleMonitor(socket);
            });
            // const socketObs = new SocketObs(socket);
            // socketObs.onEvent(Event.BIND_MONITOR)
            // .subscribe(
            //     () => this.handleMonitorObs(socketObs)
            // )
            socket.on(Event.BIND_CONTROLLER, () => {
                console.log('Controller bound');
                this.handleController(socket);
            });
            // socketObs.onEvent(Event.BIND_CONTROLLER)
            // .subscribe(
            //     () => this.handleControllerObs(socketObs)
            // )
        });
    }
    handleMonitor(socket) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        const monitorDisconnected = new rxjs_2.Subject();
        this.mobileObjects.forEach((mobObj, mobObjId) => {
            console.log('mobileObject already running', mobObjId, monitorId);
            socket.emit(Event.MOBILE_OBJECT, mobObjId);
            this.sendDynamicsInfo(socket, mobObj, mobObjId, rxjs_1.merge(monitorDisconnected.asObservable(), this.mobileObjectRemoved.pipe(operators_2.filter(id => id === mobObjId))), monitorId);
        });
        this.mobileObjectAdded.subscribe(mobObjInfo => {
            console.log('handleMonitor mobileObject added', mobObjInfo.mobObjId, monitorId);
            socket.emit(Event.MOBILE_OBJECT, mobObjInfo.mobObjId);
            this.sendDynamicsInfo(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId, rxjs_1.merge(monitorDisconnected.asObservable(), this.mobileObjectRemoved.pipe(operators_2.filter(id => id === mobObjInfo.mobObjId))), monitorId);
        });
        this.mobileObjectRemoved.subscribe(mobObjId => {
            console.log('handleMonitor mobileObject removed', mobObjId, monitorId);
            socket.emit(Event.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId);
        });
        socket.on(Event.DISCONNECT, () => {
            console.log('Monitor disconnected', monitorId);
            monitorDisconnected.next();
        });
    }
    // private handleMonitorObs(socket: SocketObs) {
    //     const monitorId = 'Monitor' + this.monitorCounter;
    //     this.monitorCounter++;
    //     console.log('Monitor bound', monitorId);
    //     this.mobileObjects.forEach((mobObj, mobObjId) => {
    //         console.log('mobileObject already running', mobObjId, monitorId);
    //         socket.send(Event.MOBILE_OBJECT, mobObjId);
    //         this.sendDynamicsInfoObs(socket, mobObj, mobObjId, 
    //                 merge(socket.onEvent(Event.DISCONNECT), this.mobileObjectRemoved.pipe(filter(id => id === mobObjId))), 
    //                 monitorId);
    //     })
    //     this.mobileObjectAdded.subscribe(
    //         mobObjInfo => {
    //             console.log('handleMonitor mobileObject added', mobObjInfo.mobObjId, monitorId);
    //             socket.send(Event.MOBILE_OBJECT, mobObjInfo.mobObjId);
    //             this.sendDynamicsInfoObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId,
    //                 merge(socket.onEvent(Event.DISCONNECT), this.mobileObjectRemoved.pipe(filter(id => id === mobObjInfo.mobObjId))),
    //                 monitorId);
    //         }
    //     )
    //     this.mobileObjectRemoved.subscribe(
    //         mobObjId => {
    //             console.log('handleMonitor mobileObject removed', mobObjId, monitorId);
    //             socket.send(Event.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId);
    //         }
    //     )
    // }
    sendDynamicsInfo(socket, mobObj, mobObjId, monitorDisconnected, monitorId) {
        return mobObj.dynamicsObs
            .pipe(operators_1.tap(data => socket.emit(Event.DYNAMICS_INFO + mobObjId, JSON.stringify(data))), operators_3.takeUntil(monitorDisconnected))
            .subscribe(null, err => console.error('error in sendDynamicsInfo', mobObjId, err), () => console.log('sendDynamicsInfo completed', mobObjId, monitorId));
    }
    // private sendDynamicsInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string, 
    //                                 monitorDisconnected: Observable<any>, monitorId: string) {
    //     return mobObj.dynamicsObs
    //     .pipe(
    //         tap(data => socket.send(Event.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
    //         takeUntil(monitorDisconnected)
    //     )
    //     .subscribe(
    //         null,
    //         err => console.error('error in sendDynamicsInfo', mobObjId, err),
    //         () => console.log('sendDynamicsInfo completed', mobObjId, monitorId)
    //     );
    // }
    handleController(socket) {
        const mobObjId = 'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new mobile_object_1.MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        console.log('mobObj added', mobObjId);
        socket.emit(Event.MOBILE_OBJECT, mobObjId);
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        this.mobileObjectAdded.next({ mobObj, mobObjId });
        this.handleControllerCommands(socket, mobObj, mobObjId);
        // const sendTurnedOnInfoSubscription = this.sendTurnedOnInfo(socket, mobObj, mobObjId);
        const controllerDisconnected = new rxjs_2.Subject();
        this.sendTurnedOnInfo(socket, mobObj, mobObjId, controllerDisconnected.asObservable());
        socket.on(Event.DISCONNECT, () => {
            console.log('Controller disconnected');
            // with this Subject we have to communicate something happend on the Controller to the Monitor
            // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
            // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
            // so that it can notify the monitors, for which it behaves like an Observable, of its loss
            // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
            // we are using a property of the class MobileObjectServer
            this.mobileObjectRemoved.next(mobObjId);
            console.log('remove', mobObjId);
            this.mobileObjects.delete(mobObjId);
            controllerDisconnected.next();
            // sendTurnedOnInfoSubscription.unsubscribe();  // Maybe to be removed if 'this.mobileObjectRemoved.pipe(filter())' works
        });
    }
    // private handleControllerObs(socket: SocketObs) {
    //     const mobObjId =  'MobObj' + this.mobileObjectsRunningIndex;
    //     this.mobileObjectsRunningIndex++;
    //     const mobObj = new MobileObject();
    //     this.mobileObjects.set(mobObjId, mobObj);
    //     console.log('mobObj added', mobObjId);
    //     socket.send(Event.MOBILE_OBJECT, mobObjId);
    //     // with this Subject we have to communicate something happend on the Controller to the Monitor
    //     // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
    //     // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
    //     // so that it can notify the monitors, for which it behaves like an Observable, of its loss
    //     // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
    //     // we are using a property of the class MobileObjectServer
    //     this.mobileObjectAdded.next({mobObj, mobObjId});
    //     this.handleControllerCommandsObs(socket, mobObj, mobObjId);
    //     const sendTurnedOnInfoSubscription = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);
    //     socket.onEvent(Event.DISCONNECT).subscribe(() => {
    //         console.log('Controller disconnected');
    //         // with this Subject we have to communicate something happend on the Controller to the Monitor
    //         // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
    //         // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
    //         // so that it can notify the monitors, for which it behaves like an Observable, of its loss
    //         // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
    //         // we are using a property of the class MobileObjectServer
    //         this.mobileObjectRemoved.next(mobObjId);
    //         console.log('remove', mobObjId);
    //         this.mobileObjects.delete(mobObjId);
    //         sendTurnedOnInfoSubscription.unsubscribe();  // Maybe to be removed if 'this.mobileObjectRemoved.pipe(filter())' works
    //     });
    // }
    handleControllerCommands(socket, mobObj, mobObjId) {
        socket.on(Event.CONTROLLER_COMMAND, (commandMessage) => {
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
        });
    }
    // private handleControllerCommandsObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
    //     socket.onEvent(Event.CONTROLLER_COMMAND)
    //     .pipe(takeUntil(socket.onEvent(Event.DISCONNECT)))
    //     .subscribe((commandMessage: MobileObjectCommandMessage)  => {
    //         if (commandMessage.action === MobileObjectCommand.TURN_ON) {
    //             console.log('TURN_ON', mobObjId);
    //             mobObj.turnOn();
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
    //             console.log('TURN_OFF', mobObjId);
    //             mobObj.turnOff();
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
    //             console.log('ACCELERATE_X', commandMessage, mobObjId);
    //             mobObj.accelerateX(commandMessage.value);
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
    //             console.log('ACCELERATE_Y', commandMessage, mobObjId);
    //             mobObj.accelerateY(commandMessage.value);
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.BRAKE) {
    //             console.log('BRAKE', mobObjId);
    //             mobObj.brake();
    //         } else
    //         {
    //             console.error('command not supported', commandMessage);
    //         }
    //     });
    // }
    sendTurnedOnInfo(socket, mobObj, mobObjId, controllerDisconnected) {
        return mobObj.isTurnedOnObs.pipe(operators_1.tap(isOn => console.log('isTurnedOnObs', mobObjId, isOn)), operators_1.tap(isOn => socket.emit(Event.TURNED_ON + mobObjId, JSON.stringify(isOn))), operators_3.takeUntil(controllerDisconnected))
            .subscribe(null, err => console.error('Error in sendTurnedOnInfo', err), () => console.log('sendTurnedOnInfo completed'));
    }
    // private sendTurnedOnInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
    //     return mobObj.isTurnedOnObs.pipe(
    //         tap(isOn => console.log('isTurnedOnObs', mobObjId, isOn)),
    //         tap(isOn => socket.send(Event.TURNED_ON + mobObjId, JSON.stringify(isOn))),
    //         takeUntil(merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onEvent(Event.DISCONNECT)))
    //     )
    //     .subscribe(
    //         null,
    //         err => console.error('Error in sendTurnedOnInfo', err),
    //         () => console.log('sendTurnedOnInfo completed')
    //     );
    // }
    getApp() {
        return this.app;
    }
}
MobileObjectServer.PORT = 8081;
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server-multi-object-1.js.map