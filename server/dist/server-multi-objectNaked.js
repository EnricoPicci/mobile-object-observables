"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
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
    MessageType["BIND_MONITOR"] = "bind-monitor";
    MessageType["BIND_CONTROLLER"] = "bind-controller";
    MessageType["CONTROLLER_COMMAND"] = "command";
    MessageType["MONITOR"] = "monitor";
    MessageType["MOBILE_OBJECT"] = "mobobj";
    MessageType["MOBILE_OBJECT_REMOVED"] = "mobobj-removed";
    MessageType["DYNAMICS_INFO"] = "dynamics";
    MessageType["TURNED_ON"] = "turnedOn";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class MobileObjectServer {
    constructor() {
        this.mobileObjects = new Map();
        this.mobileObjectCounter = 1;
        this.monitorCounter = 1;
        this.mobileObjectAdded = new rxjs_1.Subject();
        this.mobileObjectRemoved = new rxjs_1.Subject();
    }
    start(socketObs) {
        socketObs.pipe(operators_1.mergeMap(socket => rxjs_1.race(socket.onMessageType(MessageType.BIND_MONITOR)
            .pipe(operators_1.take(1), operators_1.map(() => (socketObs) => this.handleMonitorObs(socketObs))), socket.onMessageType(MessageType.BIND_CONTROLLER)
            .pipe(operators_1.take(1), operators_1.map(() => (socketObs) => this.handleControllerObs(socketObs))))
            .pipe(operators_1.mergeMap(handler => handler(socket)))))
            .subscribe();
    }
    handleMonitorObs(socket) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        socket.send(MessageType.MONITOR, monitorId);
        const mobObjAdded = rxjs_1.merge(rxjs_1.from(this.mobileObjects).pipe(operators_1.map(([mobObjId, mobObj]) => ({ mobObj, mobObjId }))), this.mobileObjectAdded)
            .pipe(operators_1.tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)), operators_1.mergeMap(mobObjInfo => this.handleDynamicsObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId, this.stopSendDynamicsInfo(socket, mobObjInfo.mobObjId))));
        const mobObjRemoved = this.mobileObjectRemoved
            .pipe(operators_1.tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId)));
        return rxjs_1.merge(mobObjAdded, mobObjRemoved).pipe(operators_1.takeUntil(socket.onDisconnect()));
    }
    handleDynamicsObs(socket, mobObj, mobObjId, stopSend) {
        return mobObj.dynamicsObs
            .pipe(operators_1.tap(data => socket.send(MessageType.DYNAMICS_INFO + mobObjId, JSON.stringify(data))), operators_1.takeUntil(stopSend));
    }
    handleControllerObs(socket) {
        const mobObjId = 'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new mobile_object_1.MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        socket.send(MessageType.MOBILE_OBJECT, mobObjId);
        this.mobileObjectAdded.next({ mobObj, mobObjId });
        const commands = this.handleControllerCommandsObs(socket, mobObj);
        const turnOn = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);
        const disconnect = socket.onDisconnect()
            .pipe(operators_1.tap(() => this.mobileObjects.delete(mobObjId)), operators_1.tap(() => this.mobileObjectRemoved.next(mobObjId)));
        return rxjs_1.merge(commands, turnOn, disconnect);
    }
    handleControllerCommandsObs(socket, mobObj) {
        return socket.onMessageType(MessageType.CONTROLLER_COMMAND)
            .pipe(operators_1.tap((commandMessage) => {
            if (commandMessage.action === MobileObjectCommand.TURN_ON) {
                mobObj.turnOn();
            }
            else if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
                mobObj.turnOff();
            }
            else if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
                mobObj.accelerateX(commandMessage.value);
            }
            else if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
                mobObj.accelerateY(commandMessage.value);
            }
            else if (commandMessage.action === MobileObjectCommand.BRAKE) {
                mobObj.brake();
            }
            else {
                console.error('command not supported', commandMessage);
            }
        }), operators_1.takeUntil(socket.onDisconnect()));
    }
    sendTurnedOnInfoObs(socket, mobObj, mobObjId) {
        return mobObj.isTurnedOnObs.pipe(operators_1.tap(isOn => socket.send(MessageType.TURNED_ON + mobObjId, JSON.stringify(isOn))), operators_1.takeUntil(socket.onDisconnect()));
    }
    stopSendDynamicsInfo(socket, mobObjId) {
        return rxjs_1.merge(this.mobileObjectRemoved.pipe(operators_1.filter(id => id === mobObjId)), socket.onDisconnect());
    }
}
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server-multi-objectNaked.js.map