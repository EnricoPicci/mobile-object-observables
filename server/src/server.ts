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
    ACCELERATE_X = 'accelerateX',
    ACCELERATE_Y = 'accelerateY',
    BRAKE = 'brake'
}
export interface MobileObjectCommandMessage {
    action: MobileObjectCommand;
    value?: number;
}

export class MobileObjectServer {
    public static readonly PORT = 8081;
    public static readonly DYNAMICS_NAMESPACE = '/dynamicsInfo';

    private app: express.Application;
    private server: Server;
    private io: socketIo.Server;
    private port: string | number;
    // private dynamicsNamespace: string;

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
        this.showDynamics(true);
    }

    private createApp() {
        this.app = express();
    }

    private createServer() {
        this.server = createServer(this.app);
    }

    private config() {
        this.port = process.env.PORT || MobileObjectServer.PORT;
        // this.dynamicsNamespace = process.env.DYNAMICSNSP || MobileObjectServer.DYNAMICS_NAMESPACE;
    }

    private sockets() {
        this.io = socketIo(this.server);
    }

    private listen() {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        // const dynamicsIo = this.io.of(this.dynamicsNamespace);
        this.io.on('connect', socket => {
            console.log('Connected client on port %s.', this.port);
            socket.on('message', m => {
                const commandMessage: MobileObjectCommandMessage = m.message;
                console.log('[server](message): %s', JSON.stringify(m));
                this.io.emit('message', commandMessage);
                console.log(commandMessage);
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
                    console.error('message not supported', commandMessage);
                } 
            });

            this.dynamicsSubscription = zip(
                this.mobileObject.deltaSpaceObsX,
                this.mobileObject.deltaSpaceObsY
            )
            .subscribe(
                data => {
                    socket.emit('dynamics', JSON.stringify(data));
                }
            )

            socket.on('disconnect', () => {
                console.log('Controller client disconnected');
                this.dynamicsSubscription.unsubscribe();
            });
        });

    }

    public getApp(): express.Application {
        return this.app;
    }

    public showDynamics(bool: boolean) {
        if (bool) {
            this.showDynamicsSubscriptionX = this.mobileObject.deltaSpaceObsX
            .pipe(
                throttleTime(this.throttleTime),
                // tap(data => console.log)
            )
            .subscribe(
                d => console.log('X : ', d.cumulatedSpace, 'vel X :', d.vel)
            );
            this.showDynamicsSubscriptionY = this.mobileObject.deltaSpaceObsY
            .pipe(
                throttleTime(this.throttleTime),
                // tap(data => console.log)
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
