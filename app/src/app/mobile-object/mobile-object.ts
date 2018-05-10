
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { timer } from 'rxjs/observable/timer';

import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { switchMap } from 'rxjs/operators';
import { share } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { filter } from 'rxjs/operators';
import { DirectiveAst } from '@angular/compiler';

export interface Dynamics { deltaSpace: number; cumulatedSpace: number; acc: number; vel: number; }

const VEL_0 = 10;  // if velocity (e.g. in pix per second) is lower than this value it is considered 0 when braking

const MAX_VELOCITY = 1000;

const BRAKE_DECELERATION = 100;

// 5 Observables build the core of this Object
//   2 Observables (one per dimension, horizontal and vertical) are dedicated to push the data about the dynamics of the moving object,
//            i.e. delta space, velocity, acceleration, space covered
//   2 Observables (one per dimension, horizontal and vertical) are dedicated to emit new acceleration events
//   1 Observable is the timer that ticks at the desired time intervals
export class MobileObject {

  maxVelocity = MAX_VELOCITY;
  brakeDeceleration = BRAKE_DECELERATION;

  readonly deltaSpaceObsX: Observable<Dynamics>;
  readonly deltaSpaceObsY: Observable<Dynamics>;

  private accelerateSubjectX = new BehaviorSubject<number>(0);
  private accelerateSubjectY = new BehaviorSubject<number>(0);

  private brakeSubscriptionX: Subscription;
  private brakeSubscriptionY: Subscription;

  // timeFramesMilliseconds is a sequence of time intervals in milliseconds
  // at the end of each timeFrame an instance of 'Dynamics' is emitted by 'deltaSpaceObsX' and'deltaSpaceObsY' observables
  // each event emitted goes with an intance of type 'Dynamics', related to the X and Y axix depending on the Observable
  // the values of the instances of 'Dynamics' are the following
  //    acceleration: is the accelareation at the beginning of each timeFrame
  //    velocity: is the velocity calculated at the end of each timeFrame based on the acceleration given
  //    deltaSpace: is the space covered within each timeFrame
  //    cumulatedSpace: is the space covered since start - it is sensible to direction, so if you travel back and forth
  //                    inverting direction, than you may end up with 0 cumulatedSpace even if you have travelled a lot
  constructor(timeFramesMilliseconds?: Observable<number>, initialVelocityX = 0, initialVelocityY = 0) {
    const tFrames = timeFramesMilliseconds ? timeFramesMilliseconds : this.timeFrames(10);
    const dfX = this.dynamicsF(initialVelocityX, 0);
    this.deltaSpaceObsX = this.accelerateSubjectX.pipe(
        switchMap(acc => dfX(acc, tFrames)),
        share()
      );
    const dfY = this.dynamicsF(initialVelocityY, 0);
    this.deltaSpaceObsY = this.accelerateSubjectY.pipe(
        switchMap(acc => dfY(acc, tFrames)),
        share()
      );
  }
  // higher order function that returns a function that calculates the values releted to  the dynamics of the object
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
            })
        );
      };
      return df;
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
    this.brakeSubscriptionX = this.brakeAlongAxis(this.deltaSpaceObsX, this.accelerateSubjectX);
    this.brakeSubscriptionY = this.brakeAlongAxis(this.deltaSpaceObsY, this.accelerateSubjectY);
  }
  private brakeAlongAxis(deltaSpaceObs: Observable<Dynamics>, accObs: BehaviorSubject<number>) {
    const subscription: Subscription = this.getDirection(deltaSpaceObs).pipe(
        switchMap(direction => {
            accObs.next(-1 * direction * this.brakeDeceleration);
            return deltaSpaceObs.pipe(
                filter(data => Math.abs(data.vel) < VEL_0),
                tap(data => accObs.next(0)),
                tap(() => subscription.unsubscribe())
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
