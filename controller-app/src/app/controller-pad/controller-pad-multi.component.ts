import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import {SocketService, Event, MobileObjectCommand, MobileObjectCommandMessage} from '../services/socket-service';
import {SocketIoService} from '../services/socket-io.service';

@Component({
  selector: 'rct-controller-pad',
  templateUrl: './controller-pad.component.html',
  styleUrls: ['./controller-pad.component.css']
})
export class ControllerPadComponent implements OnInit {
  serverConnected = false;
  turnedOn = false;
  acc = 50;

  constructor(private socketService: SocketService) { }

  ngOnInit(): void {
    this.initIoConnection();
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.socketService.onEvent(Event.CONNECT)
      .subscribe(() => {
        this.serverConnected = true;
        console.log('connected multi');
        this.socketService.send(Event.BIND_CONTROLLER);
      });

    this.socketService.onEvent(Event.DISCONNECT)
      .subscribe(() => {
        this.serverConnected = false;
        console.log('disconnected');
      });

    this.socketService.onEvent(Event.MOBILE_OBJECT)
      .subscribe(mobObjId => {
        console.log('mobObjId', mobObjId);
        this.subscribeEvents(mobObjId);
      });

  }

  private subscribeEvents(mobObjId: string) {
    console.log('subscribeEvents', Event.TURNED_ON + mobObjId);
    this.socketService.onEvent(Event.TURNED_ON + mobObjId)
        .subscribe(turnedOn => {
            this.turnedOn = JSON.parse(turnedOn);
            console.log('turnedOn multi', turnedOn, this.turnedOn);
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
