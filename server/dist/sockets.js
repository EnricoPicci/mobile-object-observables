"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const socketIoServer = require("socket.io");
const socket_obs_1 = require("./socket-obs");
function sockets(httpServer, port) {
    httpServer.listen(port, () => {
        console.log('Running server on port %s', port);
    });
    return new rxjs_1.Observable((subscriber) => {
        socketIoServer(httpServer).on('connect', socket => {
            console.log('client connected');
            subscriber.next(new socket_obs_1.SocketObs(socket));
        });
    });
}
exports.sockets = sockets;
//# sourceMappingURL=sockets.js.map