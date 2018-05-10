import { Component, OnInit } from '@angular/core';

import {SocketService, Event} from '../services/socket-service';
import {SocketIoService} from '../services/socket-io.service';

export enum MobileObjectCommand {
  ACCELERATE_X = 'accelerateX',
  ACCELERATE_Y = 'accelerateY',
  BRAKE = 'brake'
}
export interface MobileObjectCommandMessage {
  action: MobileObjectCommand;
  value?: number;
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

  constructor(private socketService: SocketService) { }

  ngOnInit(): void {
    this.initIoConnection();
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.ioConnection = this.socketService.onMessage()
      .subscribe((message) => {
        console.log('message received', message)  ;
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
  }

  public sendMessage(message: MobileObjectCommandMessage) {
    if (!message) {
      return;
    }

    this.socketService.send({
      message: message
    });
  }

  rightAcc() {
    this.sendMessage({action: MobileObjectCommand.ACCELERATE_X, value: this.acc});
  }
  leftAcc() {
    this.sendMessage({action: MobileObjectCommand.ACCELERATE_X, value: -1 * this.acc});
  }
  stopAccX() {
    this.sendMessage({action: MobileObjectCommand.ACCELERATE_X, value: 0});
  }
  downAcc() {
    this.sendMessage({action: MobileObjectCommand.ACCELERATE_Y, value: this.acc});
  }
  upAcc() {
    this.sendMessage({action: MobileObjectCommand.ACCELERATE_Y, value: -1 * this.acc});
  }
  stopAccY() {
    this.sendMessage({action: MobileObjectCommand.ACCELERATE_Y, value: 0});
  }
  brake() {
    this.sendMessage({action: MobileObjectCommand.BRAKE});
  }

}
