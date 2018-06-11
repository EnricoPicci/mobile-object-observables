import { Component, OnInit, AfterViewInit, OnDestroy, ComponentRef } from '@angular/core';
import {ViewChild, ElementRef, Renderer2} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { throttleTime, merge } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { mergeMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';

import {SocketService, Event} from '../services/socket-service';
import {SocketIoService} from '../services/socket-io.service';
import {DomService} from '../services/dom.service';
import {RemoteMonitorMultiIconComponent} from './remote-monitor-multi-icon.component';

const PLAYGROUND_HEIGHT = 600;
const PLAYGROUND_WIDTH = 500;

@Component({
  selector: 'app-remote-monitor-multi',
  templateUrl: './remote-monitor-multi.component.html',
  styleUrls: ['./remote-monitor.component.css']
})
export class RemoteMonitorMultiComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;

//   accXViewVal = '0';
//   velXViewVal = '0';
//   accYViewVal = '0';
//   velYViewVal = '0';

  serverConnected = false;

  mobileObjects = new Map<string, ComponentRef<{}>>();

  constructor(private socketService: SocketService, private domService: DomService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    console.log('container', this.container);
    this.manageIoConnection();
  }

private manageIoConnection(): void {
    this.socketService.initSocket();

    this.socketService.onEvent(Event.CONNECT)
    .pipe(
        tap(() => {
            this.mobileObjects.forEach(element => element.destroy());
            this.serverConnected = true;
            // this delay is inserted to make sure we see the BIND_MONITOR message on Chrome devtools
            setTimeout(() => {
                this.socketService.send(Event.BIND_MONITOR, JSON.stringify(true));
            }, 100);
            console.log('connected');
        }),
        tap(() => this.handleMobileObjects()),
        switchMap(() => this.socketService.onEvent(Event.DISCONNECT)),
    )
    .subscribe(
        () => {
            this.serverConnected = false;
            console.log('disconnected');
        },
        console.error,
        () => console.log('CONNECT subscription completed')
    );

  }

  private handleMobileObjects() {
    this.socketService.onEvent(Event.MOBILE_OBJECT)
    .pipe(
        map(
            (mobObjId: string) => {
                console.log('mobObjId added', mobObjId);
                const mobObjRemoved = new Subject<any>();
                this.subscribeOnMobileObjectPositionMessage(mobObjId, mobObjRemoved);
                return {mobObjId, mobObjRemoved};
            }
        ),
        // mergeMap rather than switchMap since we need to complete the actions related to the remove
        // even if a request to add a new MobileObject arrives before the request to remove the previous one
        mergeMap(
            mobObjData => this.socketService.onEvent(Event.MOBILE_OBJECT_REMOVED + mobObjData.mobObjId)
                                            .pipe(map (() => mobObjData))
        ),
        tap(
            mobObjData => {
                console.log('mobObjId removed', mobObjData.mobObjId);
                mobObjData.mobObjRemoved.next();
                this.mobileObjects.get(mobObjData.mobObjId).destroy();
            }
        ),
        takeUntil(this.socketService.onEvent(Event.DISCONNECT))
    )
    .subscribe(
        null,
        console.error,
        () => console.log('MOBILE_OBJECT subscription completed')
    );
  }


  private subscribeOnMobileObjectPositionMessage(mobObjId: string, mobObjRemoved: Observable<any>) {
    const newCarIconComponentRef = this.domService.appendComponentToContainer(RemoteMonitorMultiIconComponent,
                                                                                this.container.nativeElement);
    const newCarIconComponent = newCarIconComponentRef.instance as RemoteMonitorMultiIconComponent;

    this.mobileObjects.set(mobObjId, newCarIconComponentRef);

    this.socketService.onEvent(Event.DYNAMICS_INFO + mobObjId)
    .pipe(
        map(message => JSON.parse(message)),
        tap(message => {
            const dynamicsX = message[0];
            const dynamicsY = message[1];
            const newPositionXAndDirection = this.boundSpace(dynamicsX.cumulatedSpace, PLAYGROUND_WIDTH);
            const newPositionX = newPositionXAndDirection.position;
            const newDirectionX = newPositionXAndDirection.direction;
            const newPositionYAndDirection = this.boundSpace(dynamicsY.cumulatedSpace, PLAYGROUND_HEIGHT);
            const newPositionY = newPositionYAndDirection.position;
            const newDirectionY = newPositionYAndDirection.direction;
            const velX = dynamicsX.vel;
            const velY = dynamicsY.vel;
            newCarIconComponent.position = {left: newPositionX, top: newPositionY};
            newCarIconComponent.imagerotation = Math.atan2(newDirectionY * velY, newDirectionX * velX) * 180 / Math.PI;
        }),
        // throttleTime(100),
        // tap(message => {
        //     const dynamicsX = message[0];
        //     const dynamicsY = message[1];
        //     this.accXViewVal = dynamicsX.acc.toFixed(1);
        //     this.velXViewVal = dynamicsX.vel.toFixed(1);
        //     this.accYViewVal = dynamicsY.acc.toFixed(1);
        //     this.velYViewVal = dynamicsY.vel.toFixed(1);
        // }),
        // completes the stream when either the MobileObject is removed or the connection has stopped
        takeUntil(mobObjRemoved.pipe(merge(this.socketService.onEvent(Event.DISCONNECT))))
    )
    .subscribe(
        null,
        console.error,
        () => console.log('DYNAMICS_INFO subscription completed for ', mobObjId)
    );
  }

  boundSpace(space: number, limit: number) {
    let validSpace = space % (limit * 2);
    let direction = 1;
    validSpace = Math.abs(validSpace);
    if (validSpace > limit) {
      validSpace = limit - (validSpace - limit);
      direction = -1 * direction;
    }
    return {position: validSpace, direction};
  }

}
