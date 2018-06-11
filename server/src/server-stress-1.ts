// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704

import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';

import {Observable, Observer, from} from 'rxjs';
import {Subject} from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
import { tap } from 'rxjs/operators';

// import {SocketObs} from './socket-io-observable';

export class SocketObs {
    constructor(private socket: any) {}
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

    returnObservableWhichEmits(): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            setTimeout(() => {
                observer.next(null);
            }, 100);
        });
    }
}

const terminate = new Subject<any>();

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

    private monitoSubscribeToObservables(_socket) {
        this.observables.forEach(obs => {
            obs
            // .pipe(takeUntil(terminate))
            // .pipe(tap(() => socket.onEvent('cde')))
            .pipe(tap(() => _socket.on('abc', data => data)))
            .subscribe(null, null, () => console.log('observable completed'));
        })
    }

    // private monitoSubscribeToObservables(terminateObs: Observable<any>) {
    //     this.observables.forEach(obs => {
    //         obs
    //         .pipe(takeUntil(terminateObs))
    //         .subscribe(null, null, () => console.log('observable completed'));
    //     })
    // }

    public getApp(): express.Application {
        return this.app;
    }

}

