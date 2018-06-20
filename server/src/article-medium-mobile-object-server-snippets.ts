
// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704

import * as express from 'express';

// import {Observable} from 'rxjs';
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
// import { take } from 'rxjs/operators';

import {ISocketObs as SocketObs} from './socket-obs.interface';
import {sockets} from './sockets';

import {Server } from 'http';

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
    MOBILE_OBJECT = 'mobobj',
    MOBILE_OBJECT_REMOVED = 'mobobj-removed',
    DYNAMICS_INFO = 'dynamics',
    // Outbound Messages sent to Controller
    TURNED_ON = 'turnedOn',
}

export class MobileObjectServer {
    public static readonly PORT = 8081;

    private app: express.Application;
    private port: string | number;

    private mobileObjects = new Map<string, MobileObject>();
    private mobileObjectCounter = 1;
    // private monitorCounter = 1;

    private mobileObjectAdded = new Subject<{mobObj: MobileObject, mobObjId: string}>();
    private mobileObjectRemoved = new Subject<string>();

    constructor() {}



// first snippet


    public startSocketServer1(httpServer: Server) {
        sockets(httpServer, this.port).pipe(
            mergeMap(socket =>
                race(
                    socket.onMessageType(MessageType.BIND_MONITOR)
                    .pipe(
                        map(() => (socketObs: SocketObs) => this.handleMonitorObs1(socketObs))
                    ),
                    socket.onMessageType(MessageType.BIND_CONTROLLER)
                    .pipe(
                        map(() => (socketObs: SocketObs) => this.handleControllerObs1(socketObs))
                    ),
                )
                .pipe(
                    mergeMap(handler => handler(socket)) 
                )
            )
        )
        .subscribe();
    }

    private handleMonitorObs1(_socket: SocketObs) {
        const mobObjAdded = this.mobileObjectAdded
                              .pipe(
                                mergeMap(data => data.mobObj.dynamicsObs)
                              );
        const mobObjRemoved = this.mobileObjectRemoved;
        return merge(mobObjAdded, mobObjRemoved);
    }

// END of first snippet



// SECOND snippet


    public startSocketServer2(httpServer: Server) {
        sockets(httpServer, this.port).pipe(
            mergeMap(socket =>
                race(
                    socket.onMessageType(MessageType.BIND_MONITOR)
                    .pipe(
                        map(() => (socketObs: SocketObs) => this.handleMonitorObs2(socketObs))
                    ),
                    socket.onMessageType(MessageType.BIND_CONTROLLER)
                    .pipe(
                        map(() => (socketObs: SocketObs) => this.handleControllerObs2(socketObs))
                    ),
                )
                .pipe(
                    mergeMap(handler => handler(socket)) 
                )
            )
        )
        .subscribe();
    }

    private handleMonitorObs2(socket: SocketObs) {
        const mobObjAdded = this.mobileObjectAdded
                                .pipe(
                                    tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)),
                                    mergeMap(mobObjInfo => mobObjInfo.mobObj.dynamicsObs
                                                    .pipe(
                                                        tap(dynamics => socket.send(MessageType.DYNAMICS_INFO, dynamics)),
                                                    )
                                    )
                                );
        const mobObjRemoved = this.mobileObjectRemoved
                                .pipe(
                                    tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED, mobObjId)),
                                );
        return merge(mobObjAdded, mobObjRemoved);
    }

    private handleControllerObs2(socket: SocketObs) {
        const {mobObj, mobObjId} = this.newMobileObject();
        
        this.mobileObjectAdded.next({mobObj, mobObjId});

        const commands = socket.onMessageType(MessageType.CONTROLLER_COMMAND)
                        .pipe(
                            tap(command  => this.execute(command, mobObj))
                        );

        const disconnect = socket.onDisconnect()
                        .pipe(
                            tap(() => this.mobileObjectRemoved.next(mobObjId)),
                        );

        return merge(commands, disconnect);
    }




    // Fake methods to avoid issues in VSCode
    newMobileObject() {
        return {mobObj: new MobileObject(), mobObjId: 'abc'}
    }
    execute(_command, _mobObj) {
        
    }

// end of SECOND snippet





// THIRD snippet


    public startSocketServer(httpServer: Server) {
        sockets(httpServer, this.port).pipe(
            mergeMap(socket =>
                race(
                    socket.onMessageType(MessageType.BIND_MONITOR)
                    .pipe(
                        map(() => (socketObs: SocketObs) => this.handleMonitorObs(socketObs))
                    ),
                    socket.onMessageType(MessageType.BIND_CONTROLLER)
                    .pipe(
                        map(() => (socketObs: SocketObs) => this.handleControllerObs(socketObs))
                    ),
                )
                .pipe(
                    mergeMap(handler => handler(socket)) 
                )
            )
        )
        .subscribe();
    }


    private handleMonitorObs(socket: SocketObs) {
        const mobObjAdded = this.mobileObjectAdded
                                .pipe(
                                    tap(mobObjInfo => socket.send(MessageType.MOBILE_OBJECT, mobObjInfo.mobObjId)),
                                    mergeMap(mobObjInfo => mobObjInfo.mobObj.dynamicsObs
                                                    .pipe(
                                                        tap(dynamics => socket.send(MessageType.DYNAMICS_INFO, dynamics)),
                                                        takeUntil(this.stopSendDynamicsInfo(socket, mobObjInfo.mobObjId))
                                                    )
                                    )
                                );
        const mobObjRemoved = this.mobileObjectRemoved
                                .pipe(
                                    tap(mobObjId => socket.send(MessageType.MOBILE_OBJECT_REMOVED, mobObjId)),
                                );
        return merge(mobObjAdded, mobObjRemoved);
    }

    private handleControllerObs(socket: SocketObs) {
        const {mobObj, mobObjId} = this.newMobileObject();
        
        this.mobileObjectAdded.next({mobObj, mobObjId});

        const commands = socket.onMessageType(MessageType.CONTROLLER_COMMAND)
                        .pipe(
                            tap(command  => this.execute(command, mobObj))
                        );

        const disconnect = socket.onDisconnect()
                        .pipe(
                            tap(() => this.mobileObjectRemoved.next(mobObjId)),
                        );

        return merge(commands, disconnect);
    }

    private stopSendDynamicsInfo(socket: SocketObs, mobObjId: string) {
        return merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onDisconnect());
    }




// end of THIRD snippet










    // private handleDynamicsObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string, monitorId: string,
    //                                 stopSend: Observable<any>,) {
    //     return mobObj.dynamicsObs
    //     .pipe(
    //         tap(data => socket.send(MessageType.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
    //         takeUntil(stopSend),
    //         finalize(() => console.log('sendDynamicsInfo completed', mobObjId, monitorId))
    //     );
    // }

    private handleControllerObs1(socket: SocketObs) {
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

    private handleControllerCommandsObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
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
    
    private sendTurnedOnInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
        return mobObj.isTurnedOnObs.pipe(
            tap(isOn => console.log('MobObj: ' + mobObjId + 'isTurnedOnObs: ' + isOn)),
            tap(isOn => socket.send(MessageType.TURNED_ON + mobObjId, JSON.stringify(isOn))),
            takeUntil(socket.onDisconnect()),
            finalize(() => console.log('sendTurnedOnInfo completed', mobObjId))
        );
    }

    // stream of dynamics data should be stopped if either the MobileObject is removed or if the socket is disconnected
    // the socket can either between the server and the controller of the MobileObject or between the server and the Monitor
    // private stopSendDynamicsInfo(socket: SocketObs, mobObjId: string) {
    //     return merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onDisconnect());
    // }

    public getApp(): express.Application {
        return this.app;
    }

    // added to allow tests
    getMobileObject(id: string) {
        return this.mobileObjects.get(id);
    }
    getMobileObjects() {
        return this.mobileObjects;
    }

}
