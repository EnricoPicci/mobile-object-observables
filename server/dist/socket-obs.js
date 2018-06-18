"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const socketIoClient = require("socket.io-client");
class SocketObs {
    constructor(input) {
        this.connect = new rxjs_2.Subject();
        this.disconnect = new rxjs_2.Subject();
        if (typeof input === 'string') {
            this.socket = socketIoClient(input);
        }
        else {
            this.socket = input;
        }
        this.socket.on('connect', () => {
            this.connect.next();
            // complete to make sure that this event is fired only once
            this.connect.complete();
        });
        this.socket.on('disconnect', () => {
            this.disconnect.next();
            // complete to make sure that this event is fired only once
            this.disconnect.complete();
        });
    }
    send(messageType, message) {
        this.socket.emit(messageType, message);
    }
    onMessageType(messageType) {
        return new rxjs_1.Observable((observer) => {
            this.socket.on(messageType, data => observer.next(data));
        });
    }
    // if a messageType is listened in too many places we can end up with a problem with the number of listeners
    // see https://stackoverflow.com/questions/50764953/issue-when-wrapping-socket-with-observables-maxlistenersexceededwarning-possi
    // in such case we can create a Subject, as instance property of the object, which emits when connect occurs
    // clients of SocketObs can subscribe to this single Subject and we overcome the listeners number problem
    onDisconnect() {
        return this.disconnect.asObservable();
    }
    onConnect() {
        return this.connect.asObservable();
    }
    close() {
        this.socket.close();
    }
}
exports.SocketObs = SocketObs;
//# sourceMappingURL=socket-obs.js.map