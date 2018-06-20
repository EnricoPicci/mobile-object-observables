// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704

import {Observable} from 'rxjs';
import {from} from 'rxjs';
import {merge} from 'rxjs';
import {race} from 'rxjs';
import {Subject} from 'rxjs';
import { MobileObject } from './mobile-object/mobile-object';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { take } from 'rxjs/operators';

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
    // Inbound Messages sent by Monitor
    BIND_MONITOR = 'bind-monitor',
    // Inbound Messages sent by Controller
    BIND_CONTROLLER = 'bind-controller',
    CONTROLLER_COMMAND = 'command',
    // Outbound Messages sent to Monitor
    MONITOR = 'monitor',
    MOBILE_OBJECT = 'mobobj',
    MOBILE_OBJECT_REMOVED = 'mobobj-removed',
    DYNAMICS_INFO = 'dynamics',
    // Outbound Messages sent to Controller
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
            tap(() => console.log('Connected client.')),
            mergeMap(socket =>
                // on one socket we can receive either one BIND_MONITOR or one BIND_CONTROLLER message
                // therefore we can use race method to make sure that if one type of message of one time arrives
                // we ignore potential subsequent messages of the other type
                // We can not execute the logic for Monitor and Controller within the race in order to avoid the following problem
                // https://stackoverflow.com/questions/50911412/rxjs-race-function-make-sure-that-the-first-to-occur-wins/50913418#50913418
                // Therefore rather than using mergeMap within the race processing, we return a the function to be used by merge map
                // (function which depends on the socket being for a Controller or a Monitor) and then execute it within mergeMap
                // in a pipe we attach to race
                race(
                    socket.onMessageType(MessageType.BIND_MONITOR)
                    .pipe(
                        tap(() => console.log('BIND_MONITOR message received')),
                        // make sure that the subscription is completed after the first message
                        // we can not receive more than one BIND_MONITOR message on the same socket
                        take(1),
                        // rather than having mergeMap(() => this.handleMonitorObs(socket))
                        // we return a function with merge and than execute that function with mergeMap subsequently
                        // mergeMap(() => this.handleMonitorObs(socket)),
                        map(() => (socketObs: ISocketObs) => this.handleMonitorObs(socketObs)),
                        finalize(() => console.log('BIND_MONITOR subscription completed')),
                    ),
                    socket.onMessageType(MessageType.BIND_CONTROLLER)
                    .pipe(
                        tap(() => console.log('BIND_CONTROLLER message received')),
                        // make sure that the subscription is completed after the first message
                        // we can not receive more than one BIND_CONTROLLER message on the same socket
                        take(1),
                        // rather than having mergeMap(() => this.handleControllerObs(socket))
                        // we return a function with merge and than execute that function with mergeMap subsequently
                        // mergeMap(() => this.handleControllerObs(socket)),
                        map(() => (socketObs: ISocketObs) => this.handleControllerObs(socketObs)),
                        finalize(() => console.log('BIND_CONTROLLER subscription completed')),
                    ),
                )
                .pipe(
                    mergeMap(handler => handler(socket)) 
                )
            )
        ).subscribe(null, console.error, () => console.log('Socket Server stopped'));
    }
    

    private handleMonitorObs(socket: ISocketObs) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        console.log('Monitor bound', monitorId);
        socket.send(MessageType.MONITOR, monitorId);

        const mobObjAdded = merge(
            from(this.mobileObjects).pipe(map(([mobObjId, mobObj]) => ({mobObj, mobObjId}))),
            this.mobileObjectAdded
        )
        .pipe(
            tap(mobObjInfo => console.log('handleMonitor mobileObject added ' + mobObjInfo.mobObjId + ' - Monitor: ' + monitorId)),
            tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)),
            mergeMap(
                mobObjInfo => this.handleDynamicsObs(
                                    socket, mobObjInfo.mobObj, mobObjInfo.mobObjId, monitorId,
                                    this.stopSendDynamicsInfo(socket, mobObjInfo.mobObjId),
                            )
            ),
            finalize(() => console.log('Socket disconnected - Adding mobile objects completed for Monitor: ', monitorId)),
        );

        const mobObjRemoved = this.mobileObjectRemoved
        .pipe(
            tap(mobObjId => console.log('handleMonitor mobileObject removed ' + mobObjId + ' - Monitor: ' + monitorId)),
            tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId)),
            finalize(() => console.log('Socket disconnected - Removing mobile objects completed for Monitor: ', monitorId)),
        );

        return merge(mobObjAdded, mobObjRemoved).pipe(takeUntil(socket.onDisconnect()));
    }

    private handleDynamicsObs(socket: ISocketObs, mobObj: MobileObject, mobObjId: string, monitorId: string,
                                    stopSend: Observable<any>,) {
        return mobObj.dynamicsObs
        .pipe(
            tap(data => socket.send(MessageType.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
            takeUntil(stopSend),
            finalize(() => console.log('sendDynamicsInfo completed', mobObjId, monitorId))
        );
    }

    private handleControllerObs(socket: ISocketObs) {
        const mobObjId =  'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        console.log('mobObj added', mobObjId);
        socket.send(MessageType.MOBILE_OBJECT, mobObjId);
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        this.mobileObjectAdded.next({mobObj, mobObjId});

        const commands = this.handleControllerCommandsObs(socket, mobObj, mobObjId);

        const turnOn = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);

        const disconnect = socket.onDisconnect()
        .pipe(
            tap(() => console.log('Controller disconnected ' + mobObjId)),
            tap(() => this.mobileObjects.delete(mobObjId)),
            tap(
                // with this Subject we have to communicate something happend on the Controller to the Monitor
                // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
                // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
                // so that it can notify the monitors, for which it behaves like an Observable, of its loss
                // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
                // we are using a property of the class MobileObjectServer
                () => this.mobileObjectRemoved.next(mobObjId)
            ),
        );

        return merge(commands, turnOn, disconnect);
    }

    private handleControllerCommandsObs(socket: ISocketObs, mobObj: MobileObject, mobObjId: string) {
        return socket.onMessageType(MessageType.CONTROLLER_COMMAND)
        .pipe(
            tap(
                (commandMessage: MobileObjectCommandMessage)  => {
                    if (commandMessage.action === MobileObjectCommand.TURN_ON) {
                        console.log('TURN_ON', mobObjId);
                        mobObj.turnOn();
                    } else
                    if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
                        console.log('TURN_OFF', mobObjId);
                        mobObj.turnOff();
                    } else
                    if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
                        console.log('ACCELERATE_X', commandMessage, mobObjId);
                        mobObj.accelerateX(commandMessage.value);
                    } else
                    if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
                        console.log('ACCELERATE_Y', commandMessage, mobObjId);
                        mobObj.accelerateY(commandMessage.value);
                    } else
                    if (commandMessage.action === MobileObjectCommand.BRAKE) {
                        console.log('BRAKE', mobObjId);
                        mobObj.brake();
                    } else
                    {
                        console.error('command not supported', commandMessage);
                    }
                }
            ),
            takeUntil(socket.onDisconnect()),
            finalize(() => console.log('handleControllerCommandsObs completed', mobObjId))
        );
    }
    
    private sendTurnedOnInfoObs(socket: ISocketObs, mobObj: MobileObject, mobObjId: string) {
        return mobObj.isTurnedOnObs.pipe(
            tap(isOn => console.log('MobObj: ' + mobObjId + 'isTurnedOnObs: ' + isOn)),
            tap(isOn => socket.send(MessageType.TURNED_ON + mobObjId, JSON.stringify(isOn))),
            takeUntil(socket.onDisconnect()),
            finalize(() => console.log('sendTurnedOnInfo completed', mobObjId))
        );
    }

    // stream of dynamics data should be stopped if either the MobileObject is removed or if the socket is disconnected
    // the socket can either between the server and the controller of the MobileObject or between the server and the Monitor
    private stopSendDynamicsInfo(socket: ISocketObs, mobObjId: string) {
        return merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onDisconnect());
    }

    // added to allow tests
    getMobileObject(id: string) {
        return this.mobileObjects.get(id);
    }
    getMobileObjects() {
        return this.mobileObjects;
    }

}
