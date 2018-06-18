
import { Server } from 'http';

import { Observable } from 'rxjs';
import { Observer } from 'rxjs';

import * as socketIoServer from 'socket.io';

import {SocketObs} from './socket-obs';

export function sockets(httpServer: Server, port) {
    httpServer.listen(port, () => {
        console.log('Running server on port %s', port);
    });
    return new Observable<SocketObs>(
        (subscriber: Observer<SocketObs>) => {
            socketIoServer(httpServer).on('connect', 
                socket => {
                    console.log('client connected');
                    subscriber.next(new SocketObs(socket));
                }
            );
        }
    );
}
