// this utilities are used to test MobileServerObject in isolation, i.e. without having to have a socket server running
// SocketObsTest class simulates a socket which has been opened by the socket server when a client connects to the server

import { Observable } from 'rxjs';
import { Subject } from 'rxjs';

import {ISocketObs} from './socket-obs.interface';
import {MessageType} from './server-multi-object';
import {MobileObjectCommandMessage} from './server-multi-object';

class SocketObsTest implements ISocketObs {
    onMessageTypeSubjects = new Map<string, Subject<any>>();
    
    private connectSub = new Subject<any>();
    private disconnectSub = new Subject<any>();

    sendSubject = new Subject<{messageType: string, message}>();

    constructor() {
        this.asClient();
    }

    send(messageType, message?) {
        console.log('emit', messageType, message);
        this.sendSubject.next({messageType, message})
    }
    sendCommand(message?: MobileObjectCommandMessage) {
        console.log('sendCommand', message);
        this.send(MessageType.CONTROLLER_COMMAND, message);
    }
    onMessageType(messageType): Observable<any> {
        console.log('onMessageType', messageType);
        return this.onMessageTypeSubjects.get(messageType).asObservable();
    }
    onDisconnect() {
        return this.disconnectSub.asObservable();
    }
    onConnect() {
        return this.connectSub.asObservable();
    }

    close() {
        console.log('close');
    }

    // methods to support the tests
    
    bindAsController() {
        if (!this.onMessageTypeSubjects.get(MessageType.CONTROLLER_COMMAND)) {
            const commandSub = new Subject<any>();
            this.onMessageTypeSubjects.set(MessageType.CONTROLLER_COMMAND, commandSub);
        }
        this.onMessageSubject(MessageType.BIND_CONTROLLER).next();
    }
    bindAsMonitor() {
        this.onMessageSubject(MessageType.BIND_MONITOR).next();
    }
    connect() {
        this.connectSub.next();
        this.connectSub.complete();
    }
    disconnect() {
        this.disconnectSub.next();
        this.disconnectSub.complete();
    }
    protected asClient() {
        const bindControllerSub = new Subject<any>();
        const bindMonitorSub = new Subject<any>();
        this.onMessageTypeSubjects.set(MessageType.BIND_CONTROLLER, bindControllerSub);
        this.onMessageTypeSubjects.set(MessageType.BIND_MONITOR, bindMonitorSub);
        return this;
    }

    onMessageSubject(messageType: MessageType) {
        return this.onMessageTypeSubjects.get(messageType);
    }

}

export function socketConnected(sockets: Subject<ISocketObs>) {
    const socket = new SocketObsTest();
    sockets.next(socket);
    return socket;
}

