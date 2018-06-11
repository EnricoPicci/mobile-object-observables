
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import {ReplaySubject} from 'rxjs';

import { timer } from 'rxjs';
import { zip } from 'rxjs';

import { tap, distinctUntilChanged } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { share } from 'rxjs/operators';
import { publishReplay } from 'rxjs/operators';
import { refCount } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import {skipToggle} from 'rxjs-more-operators';

export interface Dynamics { deltaSpace: number; cumulatedSpace: number; acc: number; vel: number; }

const VEL_0 = 10;  // if velocity (e.g. in pix per second) is lower than this value it is considered 0 when braking

const MAX_VELOCITY = 1000;

const BRAKE_DECELERATION = 100;

// 6 Observables build the core of this Object
//   1 Observable is dedicated to emit the 'turnOn' 'turnOff' event
//   2 Observables (one per dimension, horizontal and vertical) are dedicated to push the data about the dynamics of the moving object,
//            i.e. delta space, velocity, acceleration, space covered
//   2 Observables (one per dimension, horizontal and vertical) are dedicated to emit new acceleration events
//   1 Observable is the timer that ticks at the desired time intervals
export class MobileObject {

  maxVelocity = MAX_VELOCITY;
  brakeDeceleration = BRAKE_DECELERATION;

  readonly dynamicsObsX: Observable<Dynamics>;
  readonly dynamicsObsY: Observable<Dynamics>;
  readonly dynamicsObs: Observable<[Dynamics, Dynamics]>;

  private accelerateSubjectX = new BehaviorSubject<number>(0);
  private accelerateSubjectY = new BehaviorSubject<number>(0);

  private turnOnSubject = new ReplaySubject<boolean>(1);
  readonly isTurnedOnObs: Observable<boolean>;

  private brakeSubscriptionX: Subscription;
  private brakeSubscriptionY: Subscription;

  // timeFramesMilliseconds is a sequence of time intervals in milliseconds
  // it starts emitting when 'turnOnSubject' emits true and stops emitting when 'turnOnSubject' emits false, until the next
  // true is emitted by 'turnOnSubject'
  // at the end of each timeFrame an instance of 'Dynamics' is emitted by 'deltaSpaceObsX' and'deltaSpaceObsY' observables
  // each event emitted goes with an intance of type 'Dynamics', related to the X and Y axix depending on the Observable
  // the values of the instances of 'Dynamics' are the following
  //    acceleration: is the accelareation at the beginning of each timeFrame
  //    velocity: is the velocity calculated at the end of each timeFrame based on the acceleration given
  //    deltaSpace: is the space covered within each timeFrame
  //    cumulatedSpace: is the space covered since start - it is sensible to direction, so if you travel back and forth
  //                    inverting direction, than you may end up with 0 cumulatedSpace even if you have travelled a lot
  constructor(timeFramesMilliseconds?: Observable<number>, initialVelocityX = 0, initialVelocityY = 0, turnOn = false) {
    this.isTurnedOnObs = this.turnOnSubject.asObservable();
    this.turnOnSubject.next(false);
    const tFrames = this.tFrames(timeFramesMilliseconds);

    const dfX = this.dynamicsF(initialVelocityX, 0);
    // this.dynamicsObsX = this.accelerateSubjectX.pipe(
    //     switchMap(acc => dfX(acc, tFrames)),
    //     // we use publishReplay(1) and refCount() instead of shareReplay(1) since there is a bug is shareReplay
    //     // https://stackoverflow.com/questions/50407240/test-in-mocha-not-completing-if-sharereplay-operator-of-rxjs-is-used
    //     publishReplay(1),
    //     refCount(),
    //   );
    this.dynamicsObsX = this.dynamicsSharedF(this.accelerateSubjectX, tFrames, dfX);

    const dfY = this.dynamicsF(initialVelocityY, 0);
    // this.dynamicsObsY = this.accelerateSubjectY.pipe(
    //     switchMap(acc => dfY(acc, tFrames)),
    //     // we use publishReplay(1) and refCount() instead of shareReplay(1) since there is a bug is shareReplay
    //     // https://stackoverflow.com/questions/50407240/test-in-mocha-not-completing-if-sharereplay-operator-of-rxjs-is-used
    //     publishReplay(1),
    //     refCount(),
    //   );
    this.dynamicsObsY = this.dynamicsSharedF(this.accelerateSubjectY, tFrames, dfY);

    this.dynamicsObs = this.primDynamicsObs();
    
      if (turnOn) {
        this.turnOn();
    }
  }

  private primDynamicsObs() {
    return zip(
        this.dynamicsObsX,
        this.dynamicsObsY
    )
    .pipe(
        distinctUntilChanged(
            (dyn0, dyn1) => dyn0[0].cumulatedSpace === dyn1[0].cumulatedSpace && dyn0[1].cumulatedSpace === dyn1[1].cumulatedSpace
        ),
        // we use publishReplay(1) and refCount() instead of shareReplay(1) since there is a bug is shareReplay
        // https://stackoverflow.com/questions/50407240/test-in-mocha-not-completing-if-sharereplay-operator-of-rxjs-is-used
        publishReplay(1),
        refCount(),
    )
  }

  // higher order function that returns a function that calculates the values related to the dynamics of the object
  private dynamicsSharedF(
    accObservable: Observable<number>, 
    timeFramesMilliseconds: Observable<number>, 
    df: (acc: number, timeFramesMilliseconds: Observable<number>) => Observable<{
        deltaSpace: number;
        cumulatedSpace: number;
        acc: number;
        vel: number;
    }>) {
      return accObservable.pipe(
        switchMap(acc => df(acc, timeFramesMilliseconds)),
        // we use publishReplay(1) and refCount() instead of shareReplay(1) since there is a bug is shareReplay
        // https://stackoverflow.com/questions/50407240/test-in-mocha-not-completing-if-sharereplay-operator-of-rxjs-is-used
        publishReplay(1),
        refCount(),
      );;
  }

  // higher order function that returns a function that calculates the values related to the dynamics of the object
  private dynamicsF(initialVelocity: number, spaceTravelled: number) {
      let vel = initialVelocity;
      let cumulatedSpace = spaceTravelled;
      const df = (acc: number, timeFramesMilliseconds: Observable<number>) => {
        return timeFramesMilliseconds.pipe(
            map(deltaTime => {
                const seconds = deltaTime / 1000;
                const deltaVelSpace = this.deltaSpaceAndVelocityFromAcceleration(acc, vel, seconds);
                const deltaSpace = deltaVelSpace.deltaSpace;
                cumulatedSpace = cumulatedSpace + deltaSpace;
                vel = vel + deltaVelSpace.deltaVelocity;
                const direction = vel / Math.abs(vel);
                vel = Math.abs(vel) > this.maxVelocity ? this.maxVelocity * direction : vel;
                if (acc === 0 && Math.abs(vel) < VEL_0) {
                  vel = 0;
                }
                return {deltaSpace, cumulatedSpace, acc, vel};
            }),
        );
      };
      return df;
  }

  // returns an Observable that STOPS emitting when the MobileObject is turned off
  private tFrames(timeFramesMilliseconds?: Observable<number>) {
    const tF = timeFramesMilliseconds ? timeFramesMilliseconds : this.timeFrames(10);
    return tF.pipe(skipToggle(this.turnOnSubject))
  }

  private timeFrames(frameApproximateLenght: number, numberOfFrames?: number) {
    const clock = timer(0, frameApproximateLenght);
    if (numberOfFrames) {
        clock.pipe(take(numberOfFrames));
    }
    let t0 = Date.now();
    let t1: number;
    const obsTime = clock.pipe(
        tap(() => t1 = Date.now()),
        map(() => t1 - t0),
        tap(() => t0 = t1),
        share()  // THIS IS TO MAKE SURE WE SHARE THE SAME CLOCK ON BOTH DIMENSIONS X & Y
    );
    return obsTime;
  }

  private deltaVelocityFromAcceleration(acceleration: number, deltaTime: number) {
      return acceleration * deltaTime;
  }
  private deltaSpaceAndVelocityFromAcceleration(acceleration: number, initialVelocity: number, deltaTime: number) {
      const deltaVelocity = this.deltaVelocityFromAcceleration(acceleration, deltaTime);
      const averageVelocity = initialVelocity + (deltaVelocity / 2);
      const deltaSpace = averageVelocity * deltaTime;
      return {deltaVelocity, deltaSpace};
  }

  turnOn() {
      this.turnOnSubject.next(true);
  }
  turnOff() {
      this.turnOnSubject.next(false);
  }
  
  accelerateX(acc: number) {
    if (this.brakeSubscriptionX) {
        this.brakeSubscriptionX.unsubscribe();
    }
    this.accelerateSubjectX.next(acc);
  }
  accelerateY(acc: number) {
    if (this.brakeSubscriptionY) {
        this.brakeSubscriptionY.unsubscribe();
    }
    this.accelerateSubjectY.next(acc);
  }

  brake() {
    this.brakeSubscriptionX = this.brakeAlongAxis(this.dynamicsObsX, this.accelerateSubjectX);
    this.brakeSubscriptionY = this.brakeAlongAxis(this.dynamicsObsY, this.accelerateSubjectY);
  }
  private brakeAlongAxis(deltaSpaceObs: Observable<Dynamics>, accObs: BehaviorSubject<number>) {
    const subscription: Subscription = this.getDirection(deltaSpaceObs).pipe(
        switchMap(direction => {
            accObs.next(-1 * direction * this.brakeDeceleration);
            return deltaSpaceObs.pipe(
                filter(data => Math.abs(data.vel) < VEL_0),
                tap(() => accObs.next(0)),
                take(1)
            );
        })
    ).subscribe();
    return subscription;
  }
  // returns an Observable of number indicating the direction: 1 means positive velocity, -1 negative velocity
  private getDirection(deltaSpaceObs: Observable<Dynamics>) {
    return deltaSpaceObs.pipe(
        take(1),
        map(data => data.vel > 0 ? 1 : -1),
    );
  }

  pedalUp() {
    this.accelerateX(0);
    this.accelerateY(0);
  }

}
