
import {Observable} from 'rxjs';

export interface ISocketObs {
    send(messageType, message?) : void;
    onMessageType(messageType): Observable<any>;
    onDisconnect() : Observable<any>;
    onConnect() : Observable<any>;

    close() : void;
}
