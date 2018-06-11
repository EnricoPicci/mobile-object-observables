
import { Observable } from 'rxjs/Observable';

export enum MobileObjectCommand {
    TURN_ON = 'turnOn',
    TURN_OFF = 'turnOff',
    ACCELERATE_X = 'accelerateX',
    ACCELERATE_Y = 'accelerateY',
    BRAKE = 'brake',
}
export interface MobileObjectCommandMessage {
    action: MobileObjectCommand;
    value?: number;
    // id?: string;
}

export enum Event {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    // Inbound Events used by the application
    BIND_MONITOR = 'bind-monitor', //
    BIND_CONTROLLER = 'bind-controller',
    CONTROLLER_COMMAND = 'command',
    // Outbound Events used by the application to communicate to Controller
    TURNED_ON = 'turnedOn',
    // Outbound Events used by the application to communicate to Monitor
    MOBILE_OBJECT = 'mobobj',
    MOBILE_OBJECT_REMOVED = 'mobobj-removed',
    DYNAMICS_INFO = 'dynamics',
}


export abstract class SocketService {
    abstract initSocket();
    abstract send(event: Event, data);
    abstract onEvent(event): Observable<Event>;
}
