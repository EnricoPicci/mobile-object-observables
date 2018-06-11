// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704

import { createServer, Server } from 'http';
import * as express from 'express';
// import * as socketIo from 'socket.io';

import {Observable} from 'rxjs';
import {merge} from 'rxjs';
import {Subject} from 'rxjs';
import { MobileObject } from './mobile-object/mobile-object';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
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
    // private io: socketIo.Server;
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
        // this.io = socketIo(this.server);
        this.listen();
    }

    private listen() {

        connectServer(this.server, this.port).pipe(
            tap(() => console.log('Connected client obs on port %s.', this.port)),
            mergeMap(socketObs =>
                merge(
                    socketObs.onEvent(Event.BIND_MONITOR)
                    .pipe(
                        tap(() => this.handleMonitorObs(socketObs)),
                        map(() => 'BIND_MONITOR')
                    ),
                    socketObs.onEvent(Event.BIND_CONTROLLER)
                    .pipe(
                        tap(() => this.handleControllerObs(socketObs)),
                        map(() => 'BIND_CONTROLLER')
                    )
                )
            )
        ).subscribe(console.log, console.error, () => console.log('really done'));

        // this.server.listen(this.port, () => {
        //     console.log('Running server on port %s', this.port);
        // });
        
        // this.io.on(Event.CONNECT, socket => {
        //     console.log('Connected client on port %s.', this.port);

        //     // socket.on(Event.BIND_MONITOR, () => {
        //     //     console.log('Monitor bound');
        //     //     this.handleMonitor(socket);
        //     // });
        //     const socketObs = new SocketObs(socket);
        //     socketObs.onEvent(Event.BIND_MONITOR)
        //     .subscribe(
        //         () => this.handleMonitorObs(socketObs)
        //     )
        //     // const socketObs = new SocketObs(socket);
        //     // socket.on(Event.BIND_MONITOR, () => {
        //     //     console.log('Monitor bound');
        //     //     this.handleMonitorObs(socketObs);
        //     // });

        //     // socket.on(Event.BIND_CONTROLLER, () => {
        //     //     console.log('Controller bound');
        //     //     this.handleController(socket);
        //     // });
        //     socketObs.onEvent(Event.BIND_CONTROLLER)
        //     .subscribe(
        //         () => this.handleControllerObs(socketObs)
        //     )

        // });
    }

    // private handleMonitor(socket: socketIo.Socket) {
    //     const monitorId = 'Monitor' + this.monitorCounter;
    //     this.monitorCounter++;
    //     const monitorDisconnected = new Subject<any>();
    //     this.mobileObjects.forEach((mobObj, mobObjId) => {
    //         console.log('mobileObject already running', mobObjId, monitorId);
    //         socket.emit(Event.MOBILE_OBJECT, mobObjId);
    //         this.sendDynamicsInfo(socket, mobObj, mobObjId,
    //             merge(monitorDisconnected.asObservable(), this.mobileObjectRemoved.pipe(filter(id => id === mobObjId))),
    //             monitorId);
    //     })
    //     this.mobileObjectAdded.subscribe(
    //         mobObjInfo => {
    //             console.log('handleMonitor mobileObject added', mobObjInfo.mobObjId, monitorId);
    //             socket.emit(Event.MOBILE_OBJECT, mobObjInfo.mobObjId);
    //             this.sendDynamicsInfo(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId,
    //                 merge(monitorDisconnected.asObservable(), this.mobileObjectRemoved.pipe(filter(id => id === mobObjInfo.mobObjId))),
    //                 monitorId);
    //         }
    //     )

    //     this.mobileObjectRemoved.subscribe(
    //         mobObjId => {
    //             console.log('handleMonitor mobileObject removed', mobObjId, monitorId);
    //             socket.emit(Event.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId);
    //         }
    //     )

    //     socket.on(Event.DISCONNECT, () => {
    //         console.log('Monitor disconnected', monitorId);
    //         monitorDisconnected.next();
    //     });
    // }
    private handleMonitorObs(socket: SocketObs) {
        const monitorId = 'Monitor' + this.monitorCounter;
        this.monitorCounter++;
        // const monitorDisconnected = new Subject<any>();
        // socket.socket.on(Event.DISCONNECT, () => {
        //     console.log('Monitor disconnected', monitorId);
        //     monitorDisconnected.next();
        // });

        console.log('Monitor bound', monitorId);
        this.mobileObjects.forEach((mobObj, mobObjId) => {
            console.log('mobileObject already running', mobObjId, monitorId);
            socket.send(Event.MOBILE_OBJECT, mobObjId);
            this.sendDynamicsInfoObs(socket, mobObj, mobObjId, 
                    // merge(socket.onEvent(Event.DISCONNECT), this.mobileObjectRemoved.pipe(filter(id => id === mobObjId))),
                    merge(socket.onDisconnect(), this.mobileObjectRemoved.pipe(filter(id => id === mobObjId))),
                    // merge(monitorDisconnected, this.mobileObjectRemoved.pipe(filter(id => id === mobObjId))),
                    monitorId);
        })
        this.mobileObjectAdded
        .pipe(
            takeUntil(socket.onDisconnect())
        )
        .subscribe(
            mobObjInfo => {
                console.log('handleMonitor mobileObject added', mobObjInfo.mobObjId, monitorId);
                socket.send(Event.MOBILE_OBJECT, mobObjInfo.mobObjId);
                this.sendDynamicsInfoObs(socket, mobObjInfo.mobObj, mobObjInfo.mobObjId,
                    // merge(socket.onEvent(Event.DISCONNECT), this.mobileObjectRemoved.pipe(filter(id => id === mobObjInfo.mobObjId))),
                    merge(socket.onDisconnect(), this.mobileObjectRemoved.pipe(filter(id => id === mobObjInfo.mobObjId))),
                    // merge(monitorDisconnected, this.mobileObjectRemoved.pipe(filter(id => id === mobObjInfo.mobObjId))),
                    monitorId);
            }
        )

        this.mobileObjectRemoved
        .pipe(
            takeUntil(socket.onDisconnect())
        )
        .subscribe(
            mobObjId => {
                console.log('handleMonitor mobileObject removed', mobObjId, monitorId);
                socket.send(Event.MOBILE_OBJECT_REMOVED + mobObjId, mobObjId);
            }
        )
    }
    // private sendDynamicsInfo(socket: socketIo.Socket, mobObj: MobileObject, mobObjId: string, 
    //                             monitorDisconnected: Observable<any>, monitorId: string) {
    //     return mobObj.dynamicsObs
    //     .pipe(
    //         tap(data => socket.emit(Event.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
    //         takeUntil(monitorDisconnected)
    //     )
    //     .subscribe(
    //         null,
    //         err => console.error('error in sendDynamicsInfo', mobObjId, err),
    //         () => console.log('sendDynamicsInfo completed', mobObjId, monitorId)
    //     );
    // }
    private sendDynamicsInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string, 
                                    monitorDisconnected: Observable<any>, monitorId: string) {
        return mobObj.dynamicsObs
        .pipe(
            tap(data => socket.send(Event.DYNAMICS_INFO + mobObjId, JSON.stringify(data))),
            takeUntil(monitorDisconnected)
        )
        .subscribe(
            null,
            err => console.error('error in sendDynamicsInfo', mobObjId, err),
            () => console.log('sendDynamicsInfo completed', mobObjId, monitorId)
        );
    }

    
    // private handleController(socket: socketIo.Socket) {
    //     const mobObjId =  'MobObj' + this.mobileObjectCounter;
    //     this.mobileObjectCounter++;
    //     const mobObj = new MobileObject();
    //     this.mobileObjects.set(mobObjId, mobObj);
    //     console.log('mobObj added', mobObjId);
    //     socket.emit(Event.MOBILE_OBJECT, mobObjId);
    //     // with this Subject we have to communicate something happend on the Controller to the Monitor
    //     // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
    //     // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
    //     // so that it can notify the monitors, for which it behaves like an Observable, of its loss
    //     // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
    //     // we are using a property of the class MobileObjectServer
    //     this.mobileObjectAdded.next({mobObj, mobObjId});

    //     this.handleControllerCommands(socket, mobObj, mobObjId);

    //     // const sendTurnedOnInfoSubscription = this.sendTurnedOnInfo(socket, mobObj, mobObjId);

    //     const controllerDisconnected = new Subject<any>();
    //     this.sendTurnedOnInfo(socket, mobObj, mobObjId, controllerDisconnected.asObservable());
    //     socket.on(Event.DISCONNECT, () => {
    //         console.log('Controller disconnected');
    //         // with this Subject we have to communicate something happend on the Controller to the Monitor
    //         // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
    //         // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
    //         // so that it can notify the monitors, for which it behaves like an Observable, of its loss
    //         // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
    //         // we are using a property of the class MobileObjectServer
    //         this.mobileObjectRemoved.next(mobObjId);
    //         console.log('remove', mobObjId);
    //         this.mobileObjects.delete(mobObjId);
    //         controllerDisconnected.next();
    //         // sendTurnedOnInfoSubscription.unsubscribe();  // Maybe to be removed if 'this.mobileObjectRemoved.pipe(filter())' works
    //     });
    // }
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

        this.handleControllerCommandsObs(socket, mobObj, mobObjId);

        const sendTurnedOnInfoSubscription = this.sendTurnedOnInfoObs(socket, mobObj, mobObjId);

        socket.onEvent(Event.DISCONNECT).subscribe(() => {
            console.log('Controller disconnected');
            // with this Subject we have to communicate something happend on the Controller to the Monitor
            // since there are potentially N Controllers and M Monitors, we need that all Monitors and Controllers
            // are subscribed to the same Subject/Observable, which behaves like a Subject when a controller disconnects
            // so that it can notify the monitors, for which it behaves like an Observable, of its loss
            // For this reason, i.e. the need to have the same Subject/Observable shared among all Controllers and Monitors, 
            // we are using a property of the class MobileObjectServer
            this.mobileObjectRemoved.next(mobObjId);
            console.log('remove', mobObjId);
            this.mobileObjects.delete(mobObjId);
            sendTurnedOnInfoSubscription.unsubscribe();  // Maybe to be removed if 'this.mobileObjectRemoved.pipe(filter())' works
        });
    }

    // private handleControllerCommands(socket: socketIo.Socket, mobObj: MobileObject, mobObjId: string) {
    //     socket.on(Event.CONTROLLER_COMMAND, (commandMessage: MobileObjectCommandMessage)  => {
    //         if (commandMessage.action === MobileObjectCommand.TURN_ON) {
    //             console.log('TURN_ON', mobObjId);
    //             mobObj.turnOn();
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
    //             console.log('TURN_OFF', mobObjId);
    //             mobObj.turnOff();
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
    //             console.log('ACCELERATE_X', commandMessage, mobObjId);
    //             mobObj.accelerateX(commandMessage.value);
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
    //             console.log('ACCELERATE_Y', commandMessage, mobObjId);
    //             mobObj.accelerateY(commandMessage.value);
    //         } else
    //         if (commandMessage.action === MobileObjectCommand.BRAKE) {
    //             console.log('BRAKE', mobObjId);
    //             mobObj.brake();
    //         } else
    //         {
    //             console.error('command not supported', commandMessage);
    //         }
    //     });
    // }
    private handleControllerCommandsObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
        socket.onEvent(Event.CONTROLLER_COMMAND)
        .pipe(takeUntil(socket.onEvent(Event.DISCONNECT)))
        .subscribe((commandMessage: MobileObjectCommandMessage)  => {
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
        });
    }
    // private sendTurnedOnInfo(socket: socketIo.Socket, mobObj: MobileObject, mobObjId: string, controllerDisconnected: Observable<any>) {
    //     return mobObj.isTurnedOnObs.pipe(
    //         tap(isOn => console.log('isTurnedOnObs', mobObjId, isOn)),
    //         tap(isOn => socket.emit(Event.TURNED_ON + mobObjId, JSON.stringify(isOn))),
    //         takeUntil(controllerDisconnected)
    //     )
    //     .subscribe(
    //         null,
    //         err => console.error('Error in sendTurnedOnInfo', err),
    //         () => console.log('sendTurnedOnInfo completed')
    //     );
    // }
    private sendTurnedOnInfoObs(socket: SocketObs, mobObj: MobileObject, mobObjId: string) {
        return mobObj.isTurnedOnObs.pipe(
            tap(isOn => console.log('isTurnedOnObs', mobObjId, isOn)),
            tap(isOn => socket.send(Event.TURNED_ON + mobObjId, JSON.stringify(isOn))),
            takeUntil(merge(this.mobileObjectRemoved.pipe(filter(id => id === mobObjId)), socket.onEvent(Event.DISCONNECT)))
        )
        .subscribe(
            null,
            err => console.error('Error in sendTurnedOnInfo', err),
            () => console.log('sendTurnedOnInfo completed')
        );
    }

    public getApp(): express.Application {
        return this.app;
    }

}
