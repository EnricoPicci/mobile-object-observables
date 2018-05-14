"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const rxjs_3 = require("rxjs");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
const operators_5 = require("rxjs/operators");
const operators_6 = require("rxjs/operators");
const VEL_0 = 10; // if velocity (e.g. in pix per second) is lower than this value it is considered 0 when braking
const MAX_VELOCITY = 1000;
const BRAKE_DECELERATION = 100;
// 6 Observables build the core of this Object
//   1 Observable is dedicated to emit the 'turnOn' 'turnOff' event
//   2 Observables (one per dimension, horizontal and vertical) are dedicated to push the data about the dynamics of the moving object,
//            i.e. delta space, velocity, acceleration, space covered
//   2 Observables (one per dimension, horizontal and vertical) are dedicated to emit new acceleration events
//   1 Observable is the timer that ticks at the desired time intervals
class MobileObject {
    // timeFramesMilliseconds is a sequence of time intervals in milliseconds
    // at the end of each timeFrame an instance of 'Dynamics' is emitted by 'deltaSpaceObsX' and'deltaSpaceObsY' observables
    // each event emitted goes with an intance of type 'Dynamics', related to the X and Y axix depending on the Observable
    // the values of the instances of 'Dynamics' are the following
    //    acceleration: is the accelareation at the beginning of each timeFrame
    //    velocity: is the velocity calculated at the end of each timeFrame based on the acceleration given
    //    deltaSpace: is the space covered within each timeFrame
    //    cumulatedSpace: is the space covered since start - it is sensible to direction, so if you travel back and forth
    //                    inverting direction, than you may end up with 0 cumulatedSpace even if you have travelled a lot
    constructor(timeFramesMilliseconds, initialVelocityX = 0, initialVelocityY = 0, turnOn = false) {
        this.maxVelocity = MAX_VELOCITY;
        this.brakeDeceleration = BRAKE_DECELERATION;
        this.accelerateSubjectX = new rxjs_1.BehaviorSubject(0);
        this.accelerateSubjectY = new rxjs_1.BehaviorSubject(0);
        this.turnOnSubject = new rxjs_2.ReplaySubject(1);
        this.isTurnedOnObs = this.turnOnSubject.asObservable();
        this.turnOnSubject.next(false);
        const tFrames = this.tFrames(timeFramesMilliseconds);
        const dfX = this.dynamicsF(initialVelocityX, 0);
        this.dynamicsObsX = this.accelerateSubjectX.pipe(operators_3.switchMap(acc => dfX(acc, tFrames)), operators_1.distinctUntilChanged(), operators_4.share());
        const dfY = this.dynamicsF(initialVelocityY, 0);
        this.dynamicsObsY = this.accelerateSubjectY.pipe(operators_3.switchMap(acc => dfY(acc, tFrames)), operators_1.distinctUntilChanged(), operators_4.share());
        if (turnOn) {
            this.turnOn();
        }
    }
    // returns an Observable that STOPS emitting when the MobileObject is turned off
    tFrames(timeFramesMilliseconds) {
        let turnedOn;
        const tF = timeFramesMilliseconds ? timeFramesMilliseconds : this.timeFrames(10);
        return this.turnOnSubject.pipe(operators_1.tap(t => turnedOn = t), operators_3.switchMap(() => tF.pipe(operators_1.skipWhile(() => !turnedOn))));
    }
    // higher order function that returns a function that calculates the values related to the dynamics of the object
    dynamicsF(initialVelocity, spaceTravelled) {
        let vel = initialVelocity;
        let cumulatedSpace = spaceTravelled;
        const df = (acc, timeFramesMilliseconds) => {
            return timeFramesMilliseconds.pipe(operators_2.map(deltaTime => {
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
                return { deltaSpace, cumulatedSpace, acc, vel };
            }));
        };
        return df;
    }
    timeFrames(frameApproximateLenght, numberOfFrames) {
        const clock = rxjs_3.timer(0, frameApproximateLenght);
        if (numberOfFrames) {
            clock.pipe(operators_5.take(numberOfFrames));
        }
        let t0 = Date.now();
        let t1;
        const obsTime = clock.pipe(operators_1.tap(() => t1 = Date.now()), operators_2.map(() => t1 - t0), operators_1.tap(() => t0 = t1), operators_4.share() // THIS IS TO MAKE SURE WE SHARE THE SAME CLOCK ON BOTH DIMENSIONS X & Y
        );
        return obsTime;
    }
    deltaVelocityFromAcceleration(acceleration, deltaTime) {
        return acceleration * deltaTime;
    }
    deltaSpaceAndVelocityFromAcceleration(acceleration, initialVelocity, deltaTime) {
        const deltaVelocity = this.deltaVelocityFromAcceleration(acceleration, deltaTime);
        const averageVelocity = initialVelocity + (deltaVelocity / 2);
        const deltaSpace = averageVelocity * deltaTime;
        return { deltaVelocity, deltaSpace };
    }
    turnOn() {
        this.turnOnSubject.next(true);
    }
    turnOff() {
        this.turnOnSubject.next(false);
    }
    accelerateX(acc) {
        if (this.brakeSubscriptionX) {
            this.brakeSubscriptionX.unsubscribe();
        }
        this.accelerateSubjectX.next(acc);
    }
    accelerateY(acc) {
        if (this.brakeSubscriptionY) {
            this.brakeSubscriptionY.unsubscribe();
        }
        this.accelerateSubjectY.next(acc);
    }
    brake() {
        this.brakeSubscriptionX = this.brakeAlongAxis(this.dynamicsObsX, this.accelerateSubjectX);
        this.brakeSubscriptionY = this.brakeAlongAxis(this.dynamicsObsY, this.accelerateSubjectY);
    }
    brakeAlongAxis(deltaSpaceObs, accObs) {
        const subscription = this.getDirection(deltaSpaceObs).pipe(operators_3.switchMap(direction => {
            accObs.next(-1 * direction * this.brakeDeceleration);
            return deltaSpaceObs.pipe(operators_6.filter(data => Math.abs(data.vel) < VEL_0), operators_1.tap(() => accObs.next(0)), operators_1.tap(() => subscription.unsubscribe()));
        })).subscribe();
        return subscription;
    }
    // returns an Observable of number indicating the direction: 1 means positive velocity, -1 negative velocity
    getDirection(deltaSpaceObs) {
        return deltaSpaceObs.pipe(operators_5.take(1), operators_2.map(data => data.vel > 0 ? 1 : -1));
    }
    pedalUp() {
        this.accelerateX(0);
        this.accelerateY(0);
    }
}
exports.MobileObject = MobileObject;
//# sourceMappingURL=mobile-object.js.map