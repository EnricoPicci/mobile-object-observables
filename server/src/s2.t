// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704


import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
// import socketIo from 'socket.io';  THIS IMPORT DOES NOT WORK

import {Subscription} from 'rxjs';
import {zip} from 'rxjs';
import { MobileObject } from './mobile-object/mobile-object';
import { throttleTime } from 'rxjs/operators';

export enum MobileObjectCommand {
    TURN_ON = 'turnOn',
    TURN_OFF = 'turnOff',
    ACCELERATE_X = 'accelerateX',
    ACCELERATE_Y = 'accelerateY',
    BRAKE = 'brake'
}
export interface MobileObjectCommandMessage {
    action: MobileObjectCommand;
    value?: number;
}
export enum MobileObjectInfoMessage {
    TURNED_ON = 'turnedOn',
    TURNED_OFF = 'turnedOff',
}
const CONTROLLER_COMMAND = 'command';
const MESSAGE_TO_CONTROLLER = 'm2c';
const DYNAMICS_INFO = 'dynamics';

export class MobileObjectServer {
    public static readonly PORT = 8081;

    private app: express.Application;
    private server: Server;
    private io: socketIo.Server;
    private port: string | number;

    private mobileObject = new MobileObject();
    private throttleTime = 1000;

    private dynamicsSubscription: Subscription;
    private showDynamicsSubscriptionX: Subscription;
    private showDynamicsSubscriptionY: Subscription;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp() {
        this.app = express();
    }

    private createServer() {
        this.server = createServer(this.app);
    }

    private config() {
        this.port = process.env.PORT || MobileObjectServer.PORT;
    }

    private sockets() {
        this.io = socketIo(this.server);
    }

    private listen() {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
        
        this.io.on('connect', socket => {
            console.log('Connected client on port %s.', this.port);

            this.handleControllerCommands(socket);

            socket.on('disconnect', () => {
                console.log('Controller client disconnected');
                if (this.dynamicsSubscription) {
                    this.dynamicsSubscription.unsubscribe();
                }
            });
        });

    }

    private handleControllerCommands(socket: socketIo.Socket) {
        socket.on(CONTROLLER_COMMAND, commandMessage => {
            console.log('commandMessage', commandMessage);
            if (commandMessage.action === MobileObjectCommand.TURN_ON) {
                this.broadcastDynamicsInfo(socket);
                this.showDynamics(true);
                socket.emit(MESSAGE_TO_CONTROLLER, JSON.stringify(MobileObjectInfoMessage.TURNED_ON));
            } else
            if (commandMessage.action === MobileObjectCommand.TURN_OFF) {
                this.dynamicsSubscription.unsubscribe();
                this.showDynamics(false);
                socket.emit(MESSAGE_TO_CONTROLLER, JSON.stringify(MobileObjectInfoMessage.TURNED_OFF));
            } else
            if (commandMessage.action === MobileObjectCommand.ACCELERATE_X) {
                this.mobileObject.accelerateX(commandMessage.value);
            } else
            if (commandMessage.action === MobileObjectCommand.ACCELERATE_Y) {
                this.mobileObject.accelerateY(commandMessage.value);
            } else
            if (commandMessage.action === MobileObjectCommand.BRAKE) {
                this.mobileObject.brake();
            } else
            {
                console.error('command not supported', commandMessage);
            }
        });
    }

    private broadcastDynamicsInfo(socket: socketIo.Socket) {
        this.dynamicsSubscription = zip(
            this.mobileObject.deltaSpaceObsX,
            this.mobileObject.deltaSpaceObsY
        )
        .subscribe(
            data => {
                socket.emit(DYNAMICS_INFO, JSON.stringify(data));
            }
        )
    }

    public getApp(): express.Application {
        return this.app;
    }

    private showDynamics(bool: boolean) {
        if (bool) {
            this.showDynamicsSubscriptionX = this.mobileObject.deltaSpaceObsX
            .pipe(
                throttleTime(this.throttleTime)
            )
            .subscribe(
                d => console.log('X : ', d.cumulatedSpace, 'vel X :', d.vel)
            );
            this.showDynamicsSubscriptionY = this.mobileObject.deltaSpaceObsY
            .pipe(
                throttleTime(this.throttleTime)
            )
            .subscribe(
                d => console.log('Y : ', d.cumulatedSpace, 'vel Y :', d.vel)
            )
        } else {
            if(this.showDynamicsSubscriptionX) {
                this.showDynamicsSubscriptionX.unsubscribe();
            }
            if(this.showDynamicsSubscriptionY) {
                this.showDynamicsSubscriptionY.unsubscribe();
            }
        }
    }

}
