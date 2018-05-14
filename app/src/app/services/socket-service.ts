
import { Observable } from 'rxjs/Observable';

export enum Event {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    DYNAMICS_INFO = 'dynamics'
}


export abstract class SocketService {
    abstract initSocket();
    abstract send(event: Event, data);
    abstract onEvent(event: Event): Observable<Event>;
}
