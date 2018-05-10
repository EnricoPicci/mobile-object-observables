
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import {ViewChild, ElementRef, Renderer2} from '@angular/core';

import { Subscription } from 'rxjs/Subscription';
import { tap } from 'rxjs/operators';
import { throttleTime } from 'rxjs/operators';
// the below imports are linked to the build of the timeframe abservable passed to MobileObject
import {animationFrame} from 'rxjs/scheduler/animationFrame';
import { interval } from 'rxjs/observable/interval';
import { defer } from 'rxjs/observable/defer';
import { map } from 'rxjs/operators';
import { share } from 'rxjs/operators';

import {MobileObject, Dynamics} from '../mobile-object/mobile-object';

const PLAYGROUND_HEIGHT = 600;
const PLAYGROUND_WIDTH = 500;

@Component({
  selector: 'app-mobile-object-view',
  templateUrl: './mobile-object-view.component.html',
  styleUrls: ['./mobile-object-view.component.css']
})
export class MobileObjectViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mobileobject') mobObjElement: ElementRef;
  readonly mobileObject: MobileObject;
  subscriptionX: Subscription;
  subscriptionY: Subscription;

  accXViewVal = '0';
  velXViewVal = '0';
  accYViewVal = '0';
  velYViewVal = '0';

  constructor(private renderer: Renderer2) {
    this.mobileObject = new MobileObject(this.timeBetweenFrames());
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.subscriptionX = this.mobileObject.deltaSpaceObsX.pipe(
      tap(dynamics => {
        const newPositionX = this.boundSpace(dynamics.cumulatedSpace, PLAYGROUND_WIDTH);
        this.mobObjElement.nativeElement.style.left = newPositionX + 'px';
      }),
      throttleTime(100),
      tap(dynamics => {
        this.accXViewVal = dynamics.acc.toFixed(1);
        this.velXViewVal = dynamics.vel.toFixed(1);
      }),
    )
    .subscribe();

    this.subscriptionY = this.mobileObject.deltaSpaceObsY.pipe(
      tap(dynamics => {
        const newPositionY = this.boundSpace(dynamics.cumulatedSpace, PLAYGROUND_HEIGHT);
        this.mobObjElement.nativeElement.style.top = newPositionY + 'px';
      }),
      throttleTime(100),
      tap(dynamics => {
        this.accYViewVal = dynamics.acc.toFixed(1);
        this.velYViewVal = dynamics.vel.toFixed(1);
      }),
    )
    .subscribe();
    console.log(this.mobileObject);
  }

  ngOnDestroy() {
    this.subscriptionX.unsubscribe();
    this.subscriptionY.unsubscribe();
  }

  rightAcc() {
    this.mobileObject.accelerateX(50);
  }
  leftAcc() {
    this.mobileObject.accelerateX(-50);
  }
  stopAccX() {
    this.mobileObject.accelerateX(0);
  }
  downAcc() {
    this.mobileObject.accelerateY(50);
  }
  upAcc() {
    this.mobileObject.accelerateY(-50);
  }
  stopAccY() {
    this.mobileObject.accelerateY(0);
  }
  brake() {
    this.mobileObject.brake();
  }

  boundSpace(space: number, limit: number) {
    let validSpace = space % (limit * 2);
    validSpace = Math.abs(validSpace);
    if (validSpace > limit) {
      validSpace = limit - (validSpace - limit);
    }
    return validSpace;
  }

  timeBetweenFrames() {
    return defer(() => {
      let startOfPreviousFrame = animationFrame.now();
      let startOfThisFrame;
      return interval(0, animationFrame).pipe(
        tap(() => startOfThisFrame = animationFrame.now()),
        map(() => startOfThisFrame - startOfPreviousFrame),
        tap(() => startOfPreviousFrame = startOfThisFrame),
        share()
      );
    });
  }

}
