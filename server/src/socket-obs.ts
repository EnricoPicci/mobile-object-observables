
import { Observable } from 'rxjs';
import { Observer } from 'rxjs';

import * as socketIoClient from 'socket.io-client';

import {ISocketObs} from './socket-obs.interface';

export class SocketObs implements ISocketObs {
    private socket: SocketIOClient.Socket;

    constructor(url: string);
    constructor(socket: SocketIO.Socket);
    constructor(input: any) {
        if (typeof input === 'string') {
            this.socket = socketIoClient(input);
        }
        else {
            this.socket = input;
        }
    }

    send(messageType, message?) {
        this.socket.emit(messageType, message);
    }
    onMessageType(messageType): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
            this.socket.on(messageType, data => observer.next(data));
        });
    }
    onConnect() {
        return new Observable<any>((observer: Observer<any>) => {
            this.socket.on('connect', () => {
                observer.next(null);
                // there can not be more than 1 "connect" event, so we complete the Observable
                observer.complete();
            });
        });
    }
    onDisconnect() {
        return new Observable<any>((observer: Observer<any>) => {
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
