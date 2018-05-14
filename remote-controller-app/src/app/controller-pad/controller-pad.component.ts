import { Component, OnInit } from '@angular/core';

import {SocketService, Event} from '../services/socket-service';
import {SocketIoService} from '../services/socket-io.service';

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

@Component({
  selector: 'rct-controller-pad',
  templateUrl: './controller-pad.component.html',
  styleUrls: ['./controller-pad.component.css']
})
export class ControllerPadComponent implements OnInit {
  ioConnection: any;
  acc = 50;
  serverConnected = false;
  turnedOn = false;

  constructor(private socketService: SocketService) { }

  ngOnInit(): void {
    this.initIoConnection();
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.ioConnection = this.socketService.onEvent(Event.MESSAGE_TO_CONTROLLER)
      .subscribe((data: any) => {
        const message = JSON.parse(data);
        console.log('message from server', message);
        // if (message === MobileObjectInfoMessage.TURNED_ON) {
        //   this.turnedOn = true;
        // } else
        // if (message === MobileObjectInfoMessage.TURNED_OFF) {
        //   this.turnedOn = false;
        // } else {
        //   throw new Error('message not known ' + message);
        // }
      });

    this.socketService.onEvent(Event.CONNECT)
      .subscribe(() => {
        this.serverConnected = true;
        console.log('connected');
      });

    this.socketService.onEvent(Event.DISCONNECT)
      .subscribe(() => {
        this.serverConnected = false;
        console.log('disconnected');
      });

    this.socketService.onEvent(Event.TURNED_ON)
      .subscribe(turnedOn => {
        this.turnedOn = JSON.parse(turnedOn);
        console.log('turnedOn', turnedOn, this.turnedOn);
      });

  }

  public sendCommand(command: MobileObjectCommandMessage) {
    if (!command) {
      return;
    }
    this.socketService.send(Event.CONTROLLER_COMMAND, command);
  }

  turnOn() {
    this.sendCommand({action: MobileObjectCommand.TURN_ON});
  }
  turnOff() {
    this.sendCommand({action: MobileObjectCommand.TURN_OFF});
  }
  rightAcc() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_X, value: this.acc});
  }
  leftAcc() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_X, value: -1 * this.acc});
  }
  stopAccX() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_X, value: 0});
  }
  downAcc() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_Y, value: this.acc});
  }
  upAcc() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_Y, value: -1 * this.acc});
  }
  stopAccY() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_Y, value: 0});
  }
  brake() {
    this.sendCommand({action: MobileObjectCommand.BRAKE});
  }

}
