"use strict";
// this utilities are used to test MobileServerObject in isolation, i.e. without having to have a socket server running
// SocketObsTest class simulates a socket which has been opened by the socket server when a client connects to the server
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const server_multi_object_1 = require("./server-multi-object");
class SocketObsTest {
    constructor() {
        this.onMessageTypeSubjects = new Map();
        this.connectSub = new rxjs_1.Subject();
        this.disconnectSub = new rxjs_1.Subject();
        this.sendSubject = new rxjs_1.Subject();
        this.asClient();
    }
    send(messageType, message) {
        console.log('emit', messageType, message);
        this.sendSubject.next({ messageType, message });
    }
    sendCommand(message) {
        console.log('sendCommand', message);
        this.send(server_multi_object_1.MessageType.CONTROLLER_COMMAND, message);
    }
    onMessageType(messageType) {
        console.log('onMessageType', messageType);
        return this.onMessageTypeSubjects.get(messageType).asObservable();
    }
    onDisconnect() {
        return this.disconnectSub.asObservable();
    }
    onConnect() {
        return this.connectSub.asObservable();
    }
    close() {
        console.log('close');
    }
    // methods to support the tests
    bindAsController() {
        if (!this.onMessageTypeSubjects.get(server_multi_object_1.MessageType.CONTROLLER_COMMAND)) {
            const commandSub = new rxjs_1.Subject();
            this.onMessageTypeSubjects.set(server_multi_object_1.MessageType.CONTROLLER_COMMAND, commandSub);
        }
        this.onMessageSubject(server_multi_object_1.MessageType.BIND_CONTROLLER).next();
    }
    bindAsMonitor() {
        this.onMessageSubject(server_multi_object_1.MessageType.BIND_MONITOR).next();
    }
    connect() {
        this.connectSub.next();
        this.connectSub.complete();
    }
    disconnect() {
        this.disconnectSub.next();
        this.disconnectSub.complete();
    }
    asClient() {
        const bindControllerSub = new rxjs_1.Subject();
        const bindMonitorSub = new rxjs_1.Subject();
        this.onMessageTypeSubjects.set(server_multi_object_1.MessageType.BIND_CONTROLLER, bindControllerSub);
        this.onMessageTypeSubjects.set(server_multi_object_1.MessageType.BIND_MONITOR, bindMonitorSub);
        return this;
    }
    onMessageSubject(messageType) {
        return this.onMessageTypeSubjects.get(messageType);
    }
}
function socketConnected(sockets) {
    const socket = new SocketObsTest();
    sockets.next(socket);
    return socket;
}
exports.socketConnected = socketConnected;
//# sourceMappingURL=socket-obs.test.js.map