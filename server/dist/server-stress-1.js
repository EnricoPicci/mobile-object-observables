"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
// import { takeUntil } from 'rxjs/operators';
const operators_1 = require("rxjs/operators");
// import {SocketObs} from './socket-io-observable';
class SocketObs {
    constructor(socket) {
        this.socket = socket;
    }
    // onEvent(event) {
    //     this.socket.on(event, data => data);
    //     // return new Observable<any>((observer: Observer<any>) => {
    //     //     // this.socket.on(event, data => observer.next(data));
    //     //     observer.next(null);
    //     //     // setTimeout(() => {
    //     //     //     observer.next(null);
    //     //     // }, 100);
    //     // });
    // };
    returnObservableWhichEmits() {
        return new rxjs_1.Observable((observer) => {
            setTimeout(() => {
                observer.next(null);
            }, 100);
        });
    }
}
exports.SocketObs = SocketObs;
const terminate = new rxjs_2.Subject();
class MobileObjectServer {
    constructor() {
        this.observables = new Array();
        this.app = express();
        this.port = process.env.PORT || MobileObjectServer.PORT;
        this.server = http_1.createServer(this.app);
        this.io = socketIo(this.server);
        this.listen();
        for (let i = 0; i < 20; i++) {
            this.observables.push(rxjs_1.from([1, 2, 3]));
        }
    }
    listen() {
        this.server.listen(this.port, () => {
            console.log('Running server STRESS 93 on port %s', this.port);
        });
        this.io.on('connect', socket => {
            console.log('Connected client on port %s.', this.port);
            socket.on('monitor', () => {
                this.monitoSubscribeToObservables(socket);
            });
            // from([0])
            // .subscribe(
            //     () => this.monitoSubscribeToObservables(socket)
            // )
            // setTimeout(() => {
            //     console.log('4000');
            //     this.monitoSubscribeToObservables(socket)
            // }, 4000);
            // const terminateObs = new Subject<any>();
            // console.log('start');
            // setTimeout(() => {
            //     this.monitoSubscribeToObservables(terminateObs)
            // }, 1);
            // setTimeout(() => {
            //     terminateObs.next();
            // }, 2);
            // const startObsObs = new Subject<any>();
            // const terminateObs = new Subject<any>();
            // startObsObs.subscribe(
            //     () => this.monitoSubscribeToObservables(terminateObs)
            // );
            // console.log('start');
            // setTimeout(() => {
            //     startObsObs.next();
            // }, 1);
            // setTimeout(() => {
            //     terminateObs.next();
            // }, 2);
        });
    }
    // private monitoSubscribeToObservables(socket: socketIo.Socket) {
    //     const monitorDisconnected = new Subject<any>();
    //     this.observables.forEach(obs => {
    //         obs
    //         .pipe(takeUntil(monitorDisconnected))
    //         .subscribe(null, null, () => console.log('observable completed'));
    //     })
    //     socket.on('disconnect', () => {
    //         console.log('Monitor disconnected');
    //         monitorDisconnected.next();
    //     });
    // }
    monitoSubscribeToObservables(_socket) {
        this.observables.forEach(obs => {
            obs
                // .pipe(takeUntil(terminate))
                // .pipe(tap(() => socket.onEvent('cde')))
                .pipe(operators_1.tap(() => _socket.on('abc', data => data)))
                .subscribe(null, null, () => console.log('observable completed'));
        });
    }
    // private monitoSubscribeToObservables(terminateObs: Observable<any>) {
    //     this.observables.forEach(obs => {
    //         obs
    //         .pipe(takeUntil(terminateObs))
    //         .subscribe(null, null, () => console.log('observable completed'));
    //     })
    // }
    getApp() {
        return this.app;
    }
}
MobileObjectServer.PORT = 8081;
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server-stress-1.js.map