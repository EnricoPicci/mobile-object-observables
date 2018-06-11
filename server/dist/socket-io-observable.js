"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const socketIoClient = require("socket.io-client");
const socketIoServer = require("socket.io");
// export function connectClient(url: string) {
//     return new Observable<SocketObs>((observer: Observer<SocketObs>) => {
//                     socketIoClient(url).on('connect', socket => observer.next(new SocketObs(socket)));
//                 });
// }
function connectServer(httpServer, port) {
    httpServer.listen(port, () => {
        console.log('Running server on port %s', port);
    });
    return new rxjs_1.Observable((observer) => {
        socketIoServer(httpServer).on('connect', socket => {
            console.log('client connected');
            observer.next(new SocketObs(socket));
        });
    });
}
exports.connectServer = connectServer;
class SocketObs {
    constructor(input) {
        this.disconnect = new rxjs_2.Subject();
        if (typeof input === 'string') {
            this.socket = socketIoClient(input);
        }
        else {
            this.socket = input;
        }
        this.socket.on('disconnect', () => this.disconnect.next());
    }
    send(event, message) {
        this.socket.emit(event, message);
    }
    onEvent(event) {
        return new rxjs_1.Observable((observer) => {
            this.socket.on(event, data => observer.next(data));
        });
    }
    onDisconnect() {
        return this.disconnect.asObservable();
    }
    close() {
        this.socket.close();
    }
}
exports.SocketObs = SocketObs;
class SocketServerObs {
    constructor(httpServer) {
        this.server = socketIoServer(httpServer);
    }
    connect() {
        return new rxjs_1.Observable((observer) => {
            this.server.on('connect', socket => observer.next(new SocketObs(socket)));
        });
    }
}
exports.SocketServerObs = SocketServerObs;
//# sourceMappingURL=socket-io-observable.js.map