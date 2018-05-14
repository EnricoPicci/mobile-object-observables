
import { Observable } from 'rxjs/Observable';

export enum Event {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    MESSAGE_TO_CONTROLLER = 'm2c',
    CONTROLLER_COMMAND = 'command',
    TURNED_ON = 'turnedOn',
}


export abstract class SocketService {
    abstract initSocket();
    abstract send(event: Event, data);
    abstract onEvent(event: Event): Observable<any>;
}
