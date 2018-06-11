// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704

import { createServer, Server } from 'http';
import * as express from 'express';

import {Observable, from} from 'rxjs';
import {merge} from 'rxjs';
import {Subject} from 'rxjs';
import { MobileObject } from './mobile-object/mobile-object';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

import {connectServer} from './socket-io-observable';
import {SocketObs} from './socket-io-observable';

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

export enum Event {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    // Inbound Events sent by Monitor
    BIND_MONITOR = 'bind-monitor',
    // Inbound Events sent by Controller
    BIND_CONTROLLER = 'bind-controller',
    CONTROLLER_COMMAND = 'command',
    // Outbound Events sent to Monitor
    MOBILE_OBJECT = 'mobobj',
    MOBILE_OBJECT_REMOVED = 'mobobj-removed',
    DYNAMICS_INFO = 'dynamics',
    // Outbound Events sent to Controller
    TURNED_ON = 'turnedOn',
}

export class MobileObjectServer {
    public static readonly PORT = 8081;

    private app: express.Application;
    private server: Server;
    private port: string | number;

    private mobileObjects = new Map<string, MobileObject>();
    private mobileObjectCounter = 1;
    private monitorCounter = 1;

    private mobileObjectAdded = new Subject<{mobObj: MobileObject, mobObjId: string}>();
    private mobileObjectRemoved = new Subject<string>();

    constructor() {
        this.app = express();
        this.port = process.env.PORT || MobileObjectServer.PORT;
        this.server = createServer(this.app);
        this.listen();
    }

    private listen() {
        connectServer(this.server, this.port).pipe(
            tap(() => console.log('Connected client obs on port %s.', this.port)),
            mergeMap(socketObs =>
                merge(
                    socketObs.onEvent(Event.BIND_MONITOR)
                    .pipe(
                        tap(() => 'BIND_MONITOR'),
                        mergeMap(() => this.handleMonitorObs(socketObs)),
                    ),
                    socketObs.onEvent(Event.BIND_CONTROLLER)
                    .pipe(
                        tap(() => 'BIND_CONTROLLER'),
                        mergeMap(() => this.handleControllerObs(socketObs)),
                    )
                )
            )
        ).subscribe(null, console.error, () => console.log('really done'));
    }

    private handleMonitorObs(socket: SocketObs) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        console.log('Monitor bound', monitorId);

        const mobObjAdded = merge(from(this.mobileObjects).pipe(map(([mobObjId, mobObj]) => ({mobObj, mobObjId}))), this.mobileObjectAdded)
        .pipe(
            tap(mobObjInfo => console.log('handleMonitor mobileObject added ' + mobObjInfo.mobObjId + ' - Monitor: ' + monitorId)),
            mergeMap(
                mobObjInfo => {
                    socket.send(Event.MOBILE_OBJECT, mobObjInfo.mobObjId);
                    return this.sendDynamicsInfoObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId,
                        merge(socket.onDisconnect(), this.mobileObjectRemoved.pipe(filter(id => id === mobObjInfo.mobObjId))),
                        monitorId);
                }
            ),
            takeUntil(socket.onDisconnect()),
            finalize(() => console.log('Socket disconnected - Adding mobile objects completed for Monitor: ', monitorId)),
        );

        const mobObjRemoved = this.mobileObjectRemoved
        .pipe(
            tap(mobObjId => console.log('handleMonitor mobileObject removed ' + mobObjId + ' - Monitor: ' + monitorId)),
            tap(mobObjId => socket.send(Event.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId)),
            takeUntil(socket.onDisconnect()),
            finalize(() => console.log('Socket disconnected - Removing mobile objects completed for Monitor: ', monitorId)),
        );

        return merge(mobObjAdded, mobObjRemoved);
    }

    private sendDynamicsInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string, 
                                    stopSend: Observable<any>, monitorId: string) {
        return mobObj.dynamicsObs
        .pipe(
            tap(data => socket.send(Event.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
            takeUntil(stopSend),
            finalize(() => console.log('sendDynamicsInfo completed', mobObjId, monitorId))
        );
    }

    private handleControllerObs(socket: SocketObs) {
        const mobObjId =  'MobObj' + this.mobileObjectCounter;
        this.mobileObjectCounter++;
        const mobObj = new MobileObject();
        this.mobileObjects.set(mobObjId, mobObj);
        console.log('mobObj added', mobObjId);
        socket.send(Event.MOBILE_OBJECT, mobObjId);
        // with this Subject we have to communicate something happend on the Controller to the Monitor
        // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
        // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
        // so that it can notify the monitors, for which it behaves like an Observable, of its loss
        // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
        // we are using a property of the class MobileObjectServer
        this.mobileObjectAdded.next({mobObj, mobObjId});

        const commands = this.handleControllerCommandsObs(socket, mobObj, mobObjId);

        const turnOn = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);

        const disconnect = socket.onEvent(Event.DISCONNECT)
        .pipe(
            tap(() => console.log('Controller disconnected ' + mobObjId)),
            tap(
                () => {
                    // with this Subject we have to communicate something happend on the Controller to the Monitor
                    // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
                    // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
                    // so that it can notify the monitors, for which it behaves like an Observable, of its loss
                    // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
                    // we are using a property of the class MobileObjectServer
                    this.mobileObjectRemoved.next(mobObjId);
                    this.mobileObjects.delete(mobObjId);
                }
            ),
        );

        return merge(commands, turnOn, disconnect);
    }

    private handleControllerCommandsObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
        return socket.onEvent(Event.CONTROLLER_COMMAND)
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
            takeUntil(socket.onEvent(Event.DISCONNECT)),
        );
    }
    
    private sendTurnedOnInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
        return mobObj.isTurnedOnObs.pipe(
            tap(isOn => console.log('MobObj: ' + mobObjId + 'isTurnedOnObs: ' + isOn)),
            tap(isOn => socket.send(Event.TURNED_ON + mobObjId, JSON.stringify(isOn))),
            takeUntil(merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onEvent(Event.DISCONNECT))),
            finalize(() => console.log('sendTurnedOnInfo completed', mobObjId))
        );
    }

    public getApp(): express.Application {
        return this.app;
    }

}
