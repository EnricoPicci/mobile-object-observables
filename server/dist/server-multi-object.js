"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const rxjs_3 = require("rxjs");
const rxjs_4 = require("rxjs");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
const operators_5 = require("rxjs/operators");
const operators_6 = require("rxjs/operators");
const operators_7 = require("rxjs/operators");
const mobile_object_1 = require("./mobile-object/mobile-object");
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
    MessageType["MONITOR"] = "monitor";
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
        this.monitorCounter = 1;
        this.mobileObjectAdded = new rxjs_4.Subject();
        this.mobileObjectRemoved = new rxjs_4.Subject();
    }
    start(socketObs) {
        socketObs.pipe(operators_1.tap(() => console.log('Connected client.')), operators_4.mergeMap(socket => 
        // on one socket we can receive either one BIND_MONITOR or one BIND_CONTROLLER message
        // therefore we can use race method to make sure that if one type of message of one time arrives
        // we ignore potential subsequent messages of the other type
        // We can not execute the logic for Monitor and Controller within the race in order to avoid the following problem
        // https://stackoverflow.com/questions/50911412/rxjs-race-function-make-sure-that-the-first-to-occur-wins/50913418#50913418
        // Therefore rather than using mergeMap within the race processing, we return a the function to be used by merge map
        // (function which depends on the socket being for a Controller or a Monitor) and then execute it within mergeMap
        // in a pipe we attach to race
        rxjs_3.race(socket.onMessageType(MessageType.BIND_MONITOR)
            .pipe(operators_1.tap(() => console.log('BIND_MONITOR message received')), 
        // make sure that the subscription is completed after the first message
        // we can not receive more than one BIND_MONITOR message on the same socket
        operators_7.take(1), operators_3.finalize(() => console.log('BIND_MONITOR subscription completed')), 
        // we return a function via mpa operator and than execute that function with mergeMap subsequently
        operators_2.map(() => (socketObs) => this.handleMonitorObs(socketObs))), socket.onMessageType(MessageType.BIND_CONTROLLER)
            .pipe(operators_1.tap(() => console.log('BIND_CONTROLLER message received')), 
        // make sure that the subscription is completed after the first message
        // we can not receive more than one BIND_CONTROLLER message on the same socket
        operators_7.take(1), operators_3.finalize(() => console.log('BIND_CONTROLLER subscription completed')), 
        // we return a function via mpa operator and than execute that function with mergeMap subsequently
        operators_2.map(() => (socketObs) => this.handleControllerObs(socketObs))))
            .pipe(operators_4.mergeMap(handler => handler(socket)))))
            .subscribe();
    }
    // It is important to explicitely state that the return is of type Observable<any>, i.e. a more generic return
    // then what TypeScript would be able to get using inference
    // The reason is that this function/method is returned from within the race condition of the 'start' method
    // Similarly also 'handleControllerObs' function/method is returned
    // 'handleControllerObs' and 'handleControllerObs' do not return the same, unless we force it adding explicitely the return
    // If they do not return the same, TypeScript complains since they are used as input for the same 'mergeMap' function
    handleMonitorObs(socket) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        console.log('Monitor bound', monitorId);
        socket.send(MessageType.MONITOR, monitorId);
        const mobObjAdded = rxjs_2.merge(rxjs_1.from(this.mobileObjects).pipe(operators_2.map(([mobObjId, mobObj]) => ({ mobObj, mobObjId }))), this.mobileObjectAdded)
            .pipe(operators_1.tap(mobObjInfo => console.log('handleMonitor mobileObject added ' + mobObjInfo.mobObjId + ' - Monitor: ' + monitorId)), operators_1.tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)), operators_4.mergeMap(mobObjInfo => this.handleDynamicsObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId, monitorId)), operators_3.finalize(() => console.log('Socket disconnected - Adding mobile objects completed for Monitor: ', monitorId)));
        const mobObjRemoved = this.mobileObjectRemoved
            .pipe(operators_1.tap(mobObjId => console.log('handleMonitor mobileObject removed ' + mobObjId + ' - Monitor: ' + monitorId)), operators_1.tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId)), operators_3.finalize(() => console.log('Socket disconnected - Removing mobile objects completed for Monitor: ', monitorId)));
        const monitorDisconnected = socket.onDisconnect();
        return rxjs_2.merge(mobObjAdded, mobObjRemoved).pipe(operators_6.takeUntil(monitorDisconnected));
    }
    handleDynamicsObs(socket, mobObj, mobObjId, monitorId) {
        return mobObj.dynamicsObs
            .pipe(operators_1.tap(data => socket.send(MessageType.DYNAMICS_INFO + mobObjId, JSON.stringify(data))), operators_6.takeUntil(this.stopSendDynamicsForMobileObject(socket, mobObjId)), operators_3.finalize(() => console.log('handleDynamicsObs completed', mobObjId, monitorId)));
    }
    // It is important to explicitely state that the return is of type Observable<any>, i.e. a more generic return
    // then what TypeScript would be able to get using inference
    // The reason is that this function/method is returned from within the race condition of the 'start' method
    // Similarly also 'handleControllerObs' function/method is returned
    // 'handleControllerObs' and 'handleControllerObs' do not return the same, unless we force it adding explicitely the return
    // If they do not return the same, TypeScript complains since they are used as input for the same 'mergeMap' function
    handleControllerObs(socket) {
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
        const controllerDisconnected = socket.onDisconnect()
            .pipe(operators_1.tap(() => console.log('Controller disconnected ' + mobObjId)), operators_1.tap(() => this.mobileObjects.delete(mobObjId)), operators_1.tap(
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        () => this.mobileObjectRemoved.next(mobObjId)), operators_3.finalize(() => console.log('onDisconnect for Controller socket completed')));
        return rxjs_2.merge(commands, turnOn).pipe(operators_6.takeUntil(controllerDisconnected));
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
        }), operators_3.finalize(() => console.log('handleControllerCommandsObs completed', mobObjId)));
    }
    sendTurnedOnInfoObs(socket, mobObj, mobObjId) {
        return mobObj.isTurnedOnObs.pipe(operators_1.tap(isOn => console.log('MobObj: ' + mobObjId + 'isTurnedOnObs: ' + isOn)), operators_1.tap(isOn => socket.send(MessageType.TURNED_ON + mobObjId, JSON.stringify(isOn))), operators_3.finalize(() => console.log('sendTurnedOnInfo completed', mobObjId)));
    }
    // stream of dynamics data should be stopped if either the MobileObject is removed or if the socket is disconnected
    // the socket can either between the server and the controller of the MobileObject or between the server and the Monitor
    stopSendDynamicsForMobileObject(socket, mobObjId) {
        return rxjs_2.merge(this.mobileObjectRemoved.pipe(operators_5.filter(id => id === mobObjId)), socket.onDisconnect());
    }
    // added to allow tests
    getMobileObject(id) {
        return this.mobileObjects.get(id);
    }
    getMobileObjects() {
        return this.mobileObjects;
    }
}
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server-multi-object.js.map