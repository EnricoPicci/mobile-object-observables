
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { Observer } from 'rxjs';

import * as socketIoClient from 'socket.io-client';

import {ISocketObs} from './socket-obs.interface';

export class SocketObs implements ISocketObs {
    private socket: SocketIOClient.Socket;
    
    private connect = new Subject<any>();
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
        this.socket.on('connect',
            () => {
                this.connect.next();
                // complete to make sure that this event is fired only once
                this.connect.complete();
            }
        );
        this.socket.on('disconnect',
            () => {
                this.disconnect.next();
                // complete to make sure that this event is fired only once
                this.disconnect.complete();
            }
        );
        
    }

    send(messageType, message?) {
        this.socket.emit(messageType, message);
    }
    onMessageType(messageType): Observable<any> {
        return new Observable<any>((observer: Observer<any>) => {
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
