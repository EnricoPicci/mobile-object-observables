"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const server_multi_object_1 = require("./server-multi-object");
const socket_obs_test_1 = require("./socket-obs.test");
// import {MessageType} from './server-multi-object';
// import {MobileObjectCommand, MobileObjectCommandMessage} from './server-multi-object';
const sockets = new rxjs_1.Subject();
const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
mobileObjectServer.start(sockets);
const controllerSocket = new socket_obs_test_1.SocketObsTest().asController();
controllerSocket.sendSubject.subscribe(message => console.log('message received', message));
sockets.next(controllerSocket);
const bindControllerSub = controllerSocket.getOnMessageSubject(server_multi_object_1.MessageType.BIND_CONTROLLER);
bindControllerSub.next();
setTimeout(() => {
    console.log('disconnect');
    controllerSocket.disconnect();
}, 1000);
//# sourceMappingURL=server-multi-object.NOsocket.test.js.map