// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704

import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import {Observable, Observer, from} from 'rxjs';
import {Subject} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
// import { tap } from 'rxjs/operators';

// import {SocketObs} from './socket-io-observable';

export class SocketObs {
    constructor(public socket: any) {}
    onEvent(event, subject?: Subject<any>): Observable<any> {
        // return new Observable<any>((observer: Observer<any>) => {
        //     this.socket.on(event, data => observer.next(data));
        // });
        let obs :Subject<any>;
        subject? obs = subject : obs = new Subject<any>();
        this.socket.on(event, data => obs.next(data));
        return obs;
    }
    onEvent1(_event): Observable<any> {
        return new Observable<any>((observer) => {observer.next(null)});
    }
}

export class MobileObjectServer {
    public static readonly PORT = 8081;

    private app: express.Application;
    private server: Server;
    private io: socketIo.Server;
    private port: string | number;

    private observables = new Array<any>();

    constructor() {
        this.app = express();
        this.port = process.env.PORT || MobileObjectServer.PORT;
        this.server = createServer(this.app);
        this.io = socketIo(this.server);
        this.listen();

        for(let i = 0; i < 20; i++) {
            this.observables.push(from([1, 2, 3]))
        }
    }

    private listen() {
        this.server.listen(this.port, () => {
            console.log('Running server STRESS 4 on port %s', this.port);
        });

        this.io.on('connect', socket => {
            console.log('Connected client on port %s.', this.port);
            const socketObs = new SocketObs(socket);
            this.monitoSubscribeToObservables(socketObs)
        });
    }

    
    private monitoSubscribeToObservables(socket: SocketObs) {
        const abc = new Subject<any>();
        socket.onEvent('abc', abc);
        this.observables.forEach(obs => {
            obs
            .pipe(takeUntil(abc))
            // .pipe(takeUntil(socket.onEvent('abc', abc)))
            // .pipe(tap(() => socket.onEvent('abc')))
            .subscribe(null, null, () => console.log('observable completed'));
        })
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

    public getApp(): express.Application {
        return this.app;
    }

}

