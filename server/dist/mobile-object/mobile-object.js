"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
const operators_5 = require("rxjs/operators");
const operators_6 = require("rxjs/operators");
const VEL_0 = 10; // if velocity (e.g. in pix per second) is lower than this value it is considered 0 when braking
const MAX_VELOCITY = 1000;
const BRAKE_DECELERATION = 100;
// 5 Observables build the core of this Object
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
    constructor(timeFramesMilliseconds, initialVelocityX = 0, initialVelocityY = 0) {
        this.maxVelocity = MAX_VELOCITY;
        this.brakeDeceleration = BRAKE_DECELERATION;
        this.accelerateSubjectX = new rxjs_1.BehaviorSubject(0);
        this.accelerateSubjectY = new rxjs_1.BehaviorSubject(0);
        const tFrames = timeFramesMilliseconds ? timeFramesMilliseconds : this.timeFrames(10);
        const dfX = this.dynamicsF(initialVelocityX, 0);
        this.deltaSpaceObsX = this.accelerateSubjectX.pipe(operators_3.switchMap(acc => dfX(acc, tFrames)), operators_4.share());
        const dfY = this.dynamicsF(initialVelocityY, 0);
        this.deltaSpaceObsY = this.accelerateSubjectY.pipe(operators_3.switchMap(acc => dfY(acc, tFrames)), operators_4.share());
    }
    // higher order function that returns a function that calculates the values releted to  the dynamics of the object
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
        const clock = rxjs_2.timer(0, frameApproximateLenght);
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
        this.brakeSubscriptionX = this.brakeAlongAxis(this.deltaSpaceObsX, this.accelerateSubjectX);
        this.brakeSubscriptionY = this.brakeAlongAxis(this.deltaSpaceObsY, this.accelerateSubjectY);
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