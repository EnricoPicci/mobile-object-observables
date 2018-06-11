
import { Server } from 'http';

import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { Observer } from 'rxjs';

import * as socketIoClient from 'socket.io-client';
import * as socketIoServer from 'socket.io';

// export function connectClient(url: string) {
//     return new Observable<SocketObs>((observer: Observer<SocketObs>) => {
//                     socketIoClient(url).on('connect', socket => observer.next(new SocketObs(socket)));
//                 });
// }

export function connectServer(httpServer: Server, port) {
    httpServer.listen(port, () => {
        console.log('Running server on port %s', port);
    });
    return new Observable<SocketObs>((observer: Observer<SocketObs>) => {
                    socketIoServer(httpServer).on('connect', 
                        socket => {
                            console.log('client connected');
                            observer.next(new SocketObs(socket));
                        });
                });
}

export class SocketObs {
    private socket: SocketIOClient.Socket;
    
    private disconnect = new Subject<any>();

    constructor(url: string);
    constructor(socket: SocketIO.Socket);
    constructor(input: any) {
        if (typeof input === 'string') {
            this.socket = socketIoClient(input);
        }
        else {
            this.socket = input;
        }
        this.socket.on('disconnect', () => this.disconnect.next());
    }

    send(event, message?) {
        this.socket.emit(event, message);
    }
    onEvent(event): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
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


export class SocketServerObs {
    private server: socketIoServer.Server;
    constructor(httpServer: Server) {
        this.server = socketIoServer(httpServer);
    }

    connect() {
        return new Observable<SocketObs>((observer: Observer<SocketObs>) => {
            this.server.on('connect', socket => observer.next(new SocketObs(socket)));
        });
    }
}
