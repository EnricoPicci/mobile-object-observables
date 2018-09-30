"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const rxjs_3 = require("rxjs");
const rxjs_4 = require("rxjs");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
const operators_5 = require("rxjs/operators");
const operators_6 = require("rxjs/operators");
const operators_7 = require("rxjs/operators");
const operators_8 = require("rxjs/operators");
const rxjs_more_operators_1 = require("rxjs-more-operators");
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
        this.dynamicsObsX = this.dynamicsSharedF(this.accelerateSubjectX, tFrames, dfX);
        const dfY = this.dynamicsF(initialVelocityY, 0);
        this.dynamicsObsY = this.dynamicsSharedF(this.accelerateSubjectY, tFrames, dfY);
        this.dynamicsObs = this.primDynamicsObs();
        if (turnOn) {
            this.turnOn();
        }
    }
    primDynamicsObs() {
        return rxjs_4.zip(this.dynamicsObsX, this.dynamicsObsY)
            .pipe(operators_1.distinctUntilChanged((dyn0, dyn1) => dyn0[0].cumulatedSpace === dyn1[0].cumulatedSpace && dyn0[1].cumulatedSpace === dyn1[1].cumulatedSpace), 
        // we use publishReplay(1) and refCount() instead of shareReplay(1) since there is a bug is shareReplay
        // https://stackoverflow.com/questions/50407240/test-in-mocha-not-completing-if-sharereplay-operator-of-rxjs-is-used
        operators_5.publishReplay(1), operators_6.refCount());
    }
    // returns an Observable which emits the dynamics information of the MobileObject over time 
    // the parameters governing the calculation of the dynamics information change if the acceleration changes
    dynamicsSharedF(accObservable, timeFramesMilliseconds, df) {
        return accObservable.pipe(operators_3.switchMap(acc => df(acc, timeFramesMilliseconds)), 
        // we use publishReplay(1) and refCount() instead of shareReplay(1) since there is a bug is shareReplay
        // https://stackoverflow.com/questions/50407240/test-in-mocha-not-completing-if-sharereplay-operator-of-rxjs-is-used
        operators_5.publishReplay(1), operators_6.refCount());
        ;
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
    // returns an Observable that STOPS emitting when the MobileObject is turned off
    tFrames(timeFramesMilliseconds) {
        const tF = timeFramesMilliseconds ? timeFramesMilliseconds : this.timeFrames(10);
        return tF.pipe(rxjs_more_operators_1.skipToggle(this.turnOnSubject));
    }
    timeFrames(frameApproximateLenght, numberOfFrames) {
        const clock = rxjs_3.timer(0, frameApproximateLenght);
        if (numberOfFrames) {
            clock.pipe(operators_7.take(numberOfFrames));
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
            return deltaSpaceObs.pipe(operators_8.filter(data => Math.abs(data.vel) < VEL_0), operators_1.tap(() => accObs.next(0)), operators_7.take(1));
        })).subscribe();
        return subscription;
    }
    // returns an Observable of number indicating the direction: 1 means positive velocity, -1 negative velocity
    getDirection(deltaSpaceObs) {
        return deltaSpaceObs.pipe(operators_7.take(1), operators_2.map(data => data.vel > 0 ? 1 : -1));
    }
    pedalUp() {
        this.accelerateX(0);
        this.accelerateY(0);
    }
}
exports.MobileObject = MobileObject;
//# sourceMappingURL=mobile-object.js.map