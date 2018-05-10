
import { Observable } from 'rxjs/Observable';

export enum Event {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect'
  }


export abstract class SocketService {
    abstract initSocket();
    abstract send(message);
    abstract onMessage(): Observable<any>;
    abstract onEvent(event: Event): Observable<Event>;
}
