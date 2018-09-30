"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const socketIoClient = require("socket.io-client");
class SocketObs {
    constructor(input) {
        if (typeof input === 'string') {
            this.socket = socketIoClient(input);
        }
        else {
            this.socket = input;
        }
    }
    send(messageType, message) {
        this.socket.emit(messageType, message);
    }
    onMessageType(messageType) {
        return new rxjs_1.Observable((observer) => {
            this.socket.on(messageType, data => observer.next(data));
        });
    }
    onConnect() {
        return new rxjs_1.Observable((observer) => {
            this.socket.on('connect', () => {
                observer.next(null);
                // there can not be more than 1 "connect" event, so we complete the Observable
                observer.complete();
            });
        });
    }
    onDisconnect() {
        return new rxjs_1.Observable((observer) => {
            this.socket.on('disconnect', () => {
                observer.next(null);
                // there can not be more than 1 "disconnect" event, so we complete the Observable
                observer.complete();
            });
        });
    }
    close() {
        this.socket.close();
    }
}
exports.SocketObs = SocketObs;
//# sourceMappingURL=socket-obs.js.map