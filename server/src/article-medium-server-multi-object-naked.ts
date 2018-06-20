import {Observable, Subject, from, merge, race} from 'rxjs';
import { tap, map, mergeMap, filter, takeUntil, take } from 'rxjs/operators';

import { MobileObject } from './mobile-object/mobile-object';
import {ISocketObs} from './socket-obs.interface';

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
}

export enum MessageType {
    BIND_MONITOR = 'bind-monitor',
    BIND_CONTROLLER = 'bind-controller',
    CONTROLLER_COMMAND = 'command',
    MONITOR = 'monitor',
    MOBILE_OBJECT = 'mobobj',
    MOBILE_OBJECT_REMOVED = 'mobobj-removed',
    DYNAMICS_INFO = 'dynamics',
    TURNED_ON = 'turnedOn',
}

export class MobileObjectServer {
    private mobileObjects = new Map<string, MobileObject>();
    private mobileObjectCounter = 1;
    private monitorCounter = 1;

    private mobileObjectAdded = new Subject<{mobObj: MobileObject, mobObjId: string}>();
    private mobileObjectRemoved = new Subject<string>();

    constructor() {}

    public start(socketObs: Observable<ISocketObs>) {
        socketObs.pipe(
            mergeMap(socket =>
                race(
                    socket.onMessageType(MessageType.BIND_MONITOR)
                    .pipe(
                        take(1),
                        map(() => (socketObs: ISocketObs) => this.handleMonitorObs(socketObs)),
                    ),
                    socket.onMessageType(MessageType.BIND_CONTROLLER)
                    .pipe(
                        take(1),
                        map(() => (socketObs: ISocketObs) => this.handleControllerObs(socketObs)),
                    ),
                )
                .pipe(
                    mergeMap(handler => handler(socket)) 
                )
            )
        )
        .subscribe();
    }
    

    private handleMonitorObs(socket: ISocketObs): Observable<any> {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        socket.send(MessageType.MONITOR, monitorId);

        const mobObjAdded = merge(
            from(this.mobileObjects).pipe(map(([mobObjId, mobObj]) => ({mobObj, mobObjId}))),
            this.mobileObjectAdded
        )
        .pipe(
            tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)),
            mergeMap(mobObjInfo => this.handleDynamicsObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId)),
        );

        const mobObjRemoved = this.mobileObjectRemoved
        .pipe(tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId)),);

        return merge(mobObjAdded, mobObjRemoved).pipe(takeUntil(socket.onDisconnect()));
    }

    private handleDynamicsObs(socket: ISocketObs, mobObj: MobileObject, mobObjId: string) {
        return mobObj.dynamicsObs
        .pipe(
            tap(data => socket.send(MessageType.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
            takeUntil(this.stopSendDynamicsInfo(socket, mobObjId)),
        );
    }

    private handleControllerObs(socket: ISocketObs): Observable<any> {
        const mobObjId =  'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        socket.send(MessageType.MOBILE_OBJECT, mobObjId);
        this.mobileObjectAdded.next({mobObj, mobObjId});

        const commands = this.handleControllerCommandsObs(socket, mobObj);

        const turnOn = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);

        const disconnect = socket.onDisconnect()
        .pipe(
            tap(() => this.mobileObjects.delete(mobObjId)),
            tap(() => this.mobileObjectRemoved.next(mobObjId)),
        );

        return merge(commands, turnOn).pipe(takeUntil(disconnect));
    }

    private handleControllerCommandsObs(socket: ISocketObs, mobObj: MobileObject) {
        return socket.onMessageType(MessageType.CONTROLLER_COMMAND)
        .pipe(
            tap(
                (commandMessage: MobileObjectCommandMessage)  => {
                    if (commandMessage.action === MobileObjectCommand.TURN_ON) {
                        mobObj.turnOn();
                    } else
                    if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
                        mobObj.turnOff();
                    } else
                    if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
                        mobObj.accelerateX(commandMessage.value);
                    } else
                    if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
                        mobObj.accelerateY(commandMessage.value);
                    } else
                    if (commandMessage.action === MobileObjectCommand.BRAKE) {
                        mobObj.brake();
                    } else
                    {
                        console.error('command not supported', commandMessage);
                    }
                }
            ),
        );
    }
    
    private sendTurnedOnInfoObs(socket: ISocketObs, mobObj: MobileObject, mobObjId: string) {
        return mobObj.isTurnedOnObs.pipe(
            tap(isOn => socket.send(MessageType.TURNED_ON + mobObjId, JSON.stringify(isOn))),
        );
    }

    private stopSendDynamicsInfo(socket: ISocketObs, mobObjId: string) {
        return merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onDisconnect());
    }

}
