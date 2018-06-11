"use strict";
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const socketIo = require("socket.io");
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const operators_1 = require("rxjs/operators");
// import { tap } from 'rxjs/operators';
// import {SocketObs} from './socket-io-observable';
class SocketObs {
    constructor(socket) {
        this.socket = socket;
    }
    onEvent(event, subject) {
        // return new Observable<any>((observer: Observer<any>) => {
        //     this.socket.on(event, data => observer.next(data));
        // });
        let obs;
        subject ? obs = subject : obs = new rxjs_2.Subject();
        this.socket.on(event, data => obs.next(data));
        return obs;
    }
    onEvent1(_event) {
        return new rxjs_1.Observable((observer) => { observer.next(null); });
    }
}
exports.SocketObs = SocketObs;
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
            console.log('Running server STRESS 4 on port %s', this.port);
        });
        this.io.on('connect', socket => {
            console.log('Connected client on port %s.', this.port);
            const socketObs = new SocketObs(socket);
            this.monitoSubscribeToObservables(socketObs);
        });
    }
    monitoSubscribeToObservables(socket) {
        const abc = new rxjs_2.Subject();
        socket.onEvent('abc', abc);
        this.observables.forEach(obs => {
            obs
                .pipe(operators_1.takeUntil(abc))
                // .pipe(takeUntil(socket.onEvent('abc', abc)))
                // .pipe(tap(() => socket.onEvent('abc')))
                .subscribe(null, null, () => console.log('observable completed'));
        });
    }
    // private listen() {
    //     this.server.listen(this.port, () => {
    //         console.log('Running server STRESS on port %s', this.port);
    //     });
    //     this.io.on('connect', socket => {
    //         console.log('Connected client on port %s.', this.port);
    //         this.monitoSubscribeToObservables(socket);
    //     });
    // }
    // private monitoSubscribeToObservables(socket: socketIo.Socket) {
    //     const abc = new Subject<any>();
    //     this.observables.forEach(obs => {
    //         obs
    //         .pipe(takeUntil(abc))
    //         .subscribe(null, null, () => console.log('observable completed'));
    //     })
    //     socket.on('abc', () => {
    //         abc.next();
    //     });
    // }
    getApp() {
        return this.app;
    }
}
MobileObjectServer.PORT = 8081;
exports.MobileObjectServer = MobileObjectServer;
//# sourceMappingURL=server-stress.js.map