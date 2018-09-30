import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import {mergeMap, tap, takeUntil} from 'rxjs/operators';
import { merge } from 'rxjs';

import {NgJoystickComponent} from 'ng-joystick';

import {SocketService, Event, MobileObjectCommand, MobileObjectCommandMessage} from '../services/socket-service';

@Component({
  selector: 'rct-controller-pad',
  templateUrl: './controller-pad.component.html',
  styleUrls: ['./controller-pad.component.css']
})
export class ControllerPadComponent implements OnInit, OnDestroy, AfterViewInit {
  serverConnected = false;
  turnedOn = false;
  acc = 50;

  @ViewChild('joystick') joystickComp: NgJoystickComponent;

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
    .pipe(
      tap(mobObjId => console.log('mobObjId', mobObjId)),
      mergeMap(mobObjId => this.socketService.onEvent(Event.TURNED_ON + mobObjId)),
      takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(turnedOn => {
      this.turnedOn = JSON.parse(turnedOn);
      console.log('turnedOn multi 1', turnedOn, this.turnedOn);
    });

  }

  ngOnDestroy() {
    this.socketService.close();
  }

  ngAfterViewInit() {
    // END
    this.joystickComp.joystickRelease$
    .pipe(
      takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(
      () => {
        this.stopAccX();
        this.stopAccY();
      }
    );
    // UP
    this.joystickComp.up$
    .pipe(
      takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(
      data => {
        console.log('up', data);
        this.stopAccX();
        this.sendCommand({action: MobileObjectCommand.ACCELERATE_Y, value: -1 * this.acc});
      }
    );
    // DOWN
    this.joystickComp.down$
    .pipe(
      takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(
      data => {
        console.log('down', data);
        this.stopAccX();
        this.sendCommand({action: MobileObjectCommand.ACCELERATE_Y, value: this.acc});
      }
    );
    // LEFT
    this.joystickComp.left$
    .pipe(
      takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(
      data => {
        console.log('left', data);
        this.stopAccY();
        this.sendCommand({action: MobileObjectCommand.ACCELERATE_X, value: -1 * this.acc});
      }
    );
    // RIGHT
    this.joystickComp.right$
    .pipe(
      takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(
      data => {
        console.log('rightObs', data);
        this.stopAccY();
        this.sendCommand({action: MobileObjectCommand.ACCELERATE_X, value: this.acc});
      }
    );
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
  stopAccX() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_X, value: 0});
  }
  stopAccY() {
    this.sendCommand({action: MobileObjectCommand.ACCELERATE_Y, value: 0});
  }
  brake() {
    this.sendCommand({action: MobileObjectCommand.BRAKE});
  }

}
