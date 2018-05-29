import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {ViewChild, ElementRef, Renderer2} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { throttleTime } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';

import {MobileObject, Dynamics} from '../mobile-object/mobile-object';
import {SocketService, Event} from '../services/socket-service';
import {SocketIoService} from '../services/socket-io.service';

const PLAYGROUND_HEIGHT = 600;
const PLAYGROUND_WIDTH = 500;

@Component({
  selector: 'app-remote-monitor',
  templateUrl: './remote-monitor.component.html',
  styleUrls: ['./remote-monitor.component.css']
})
export class RemoteMonitorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mobileobject') mobObjElement: ElementRef;
  readonly mobileObject: MobileObject;
  onMessageSubscription: any;

  accXViewVal = '0';
  velXViewVal = '0';
  accYViewVal = '0';
  velYViewVal = '0';

  serverConnected = false;

  constructor(private socketService: SocketService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.manageIoConnection();
  }

  private manageIoConnection(): void {
    this.socketService.initSocket();

    this.onMessageSubscription = this.socketService.onEvent(Event.DYNAMICS_INFO)
      .pipe(
        map(message => JSON.parse(message)),
        tap(message => {
          const dynamicsX = message[0];
          const dynamicsY = message[1];
          const newPositionX = this.boundSpace(dynamicsX.cumulatedSpace, PLAYGROUND_WIDTH);
          this.mobObjElement.nativeElement.style.left = newPositionX + 'px';
          const newPositionY = this.boundSpace(dynamicsY.cumulatedSpace, PLAYGROUND_HEIGHT);
          this.mobObjElement.nativeElement.style.top = newPositionY + 'px';
        }),
        throttleTime(100),
        tap(message => {
          const dynamicsX = message[0];
          const dynamicsY = message[1];
          this.accXViewVal = dynamicsX.acc.toFixed(1);
          this.velXViewVal = dynamicsX.vel.toFixed(1);
          this.accYViewVal = dynamicsY.acc.toFixed(1);
          this.velYViewVal = dynamicsY.vel.toFixed(1);
        })
      )
      .subscribe();

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

  ngOnDestroy() {
    this.onMessageSubscription.unsubscribe();
  }

  boundSpace(space: number, limit: number) {
    let validSpace = space % (limit * 2);
    validSpace = Math.abs(validSpace);
    if (validSpace > limit) {
      validSpace = limit - (validSpace - limit);
    }
    return validSpace;
  }

}
