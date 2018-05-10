// https://medium.com/dailyjs/real-time-apps-with-typescript-integrating-web-sockets-node-angular-e2b57cbd1ec1?t=1&cn=ZmxleGlibGVfcmVjcw%3D%3D&refsrc=email&iid=9b197a27b4a14948b1d2fd4ad999e0a1&uid=39235406&nid=244%20276893704


import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
// import socketIo from 'socket.io';  THIS IMPORT DOES NOT WORK

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
    public static readonly PORT:number = 8081;
    private app: express.Application;
    private server: Server;
    private io: socketIo.Server;
    private port: string | number;

    private mobileObject = new MobileObject();

    constructor(public showDynamics = true) {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        if (this.showDynamics) {
            this.mobileObject.deltaSpaceObsX
            .pipe(
                throttleTime(500),
                // tap(data => console.log)
            )
            .subscribe(
                d => console.log('X : ', d.cumulatedSpace, 'vel X :', d.vel)
            )
        }
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

        this.io.on('connect', (socket: any) => {
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

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}
