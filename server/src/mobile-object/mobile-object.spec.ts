
import 'mocha';

// import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/operators';

import {MobileObject} from './mobile-object';


describe('accelerate', () => {

    it('0.1 - accelerates a mobile object on the X axis and measure after 1 second the speed reached and the space covered', done => {
        const acceleration = 20;
        const tf = timeFrames(10, 200);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileObject(tf);
        mobileObject.turnOn();
        mobileObject.accelerateX(acceleration);
        mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed > 21 || speed < 19) {
                console.error('speed not as expected', speed);
                done();
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 10.5 || spaceTravelled < 9.5) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done();
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 1000);
    }).timeout(10000);

    it('0.2 - accelerates a mobile object on the Y axis and measure after 2 seconds the speed reached and the space covered', done => {
        const acceleration = 30;
        const tf = timeFrames(10, 300);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileObject(tf);
        mobileObject.turnOn();
        mobileObject.accelerateY(acceleration);
        mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed > 61 || speed < 59) {
                console.error('speed not as expected', speed);
                done();
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 61 || spaceTravelled < 59) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done();
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 2000);
    }).timeout(10000);

    it('0.3 - accelerates a mobile object on both axis and measure after 1 second the speed reached and the space covered', done => {
        const accelerationX = 20;
        const accelerationY = 20;
        let speedX = 0;
        let speedY = 0;
        let spaceTravelledX = 0;
        let spaceTravelledY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        mobileObject.accelerateX(accelerationX);
        mobileObject.accelerateY(accelerationY);
        const s = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
                spaceTravelledX = data[0].cumulatedSpace;
                spaceTravelledY = data[1].cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speedX > 21 || speedX < 19) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (spaceTravelledX > 10.5 || spaceTravelledX < 9.5) {
                console.error('spaceTravelledX not as expected', spaceTravelledX);
                done();
                throw(new Error('spaceTravelledX not as expected'));
            }
            if (speedY > 21 || speedY < 19) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            if (spaceTravelledY > 10.5 || spaceTravelledY < 9.5) {
                console.error('spaceTravelledY not as expected', spaceTravelledY);
                done();
                throw(new Error('spaceTravelledY not as expected'));
            }
            s.unsubscribe();
            done();
        }, 1000);
    }).timeout(10000);

    it('0.4 - accelerates NEGATIVE a mobile object on the Y axis and measure after 2 sec the speed reached and the space covered', done => {
        const acceleration = -40;
        const tf = timeFrames(10, 300);
        let speed = 0;
        let spaceTravelled = 0;
        const mobileObject = new MobileObject(tf);
        mobileObject.turnOn();
        mobileObject.accelerateY(acceleration);
        mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed < -121 || speed > -119) {
                console.error('speed not as expected', speed);
                done();
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled < -182 || spaceTravelled > -178) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done();
                throw(new Error('spaceTravelled not as expected'));
            }
            done();
        }, 3000);
    }).timeout(10000);

});

describe('the object has an initial velocity but no acceleration', () => {

    it('1.1 - set an initial velocity but no acceleration - measure after 2 seconds the space covered', done => {
        let speed = 0;
        let spaceTravelled = 0;
        const initialSpeed = 20;
        const mobileObject = new MobileObject(null, initialSpeed);
        mobileObject.turnOn();
        // accelerate to start the movement even if acceleration is 0
        setTimeout(() => mobileObject.accelerateX(0), 0);
        const s = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
            }
        );
        setTimeout(() => {
            if (speed !== initialSpeed) {
                console.error('speed not as expected', speed);
                done();
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 42 || spaceTravelled < 38) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done();
                throw(new Error('spaceTravelled not as expected'));
            }
            s.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

});

describe('accelerate and then decelerate', () => {

    it('2.1 - accelerates a mobile object on the X axis and stops accelerating after 1 sec - measure after 2 sec speed and space', done => {
        let speed = 0;
        let spaceTravelled = 0;
        let acc = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        // first accelerate +20
        setTimeout(() => mobileObject.accelerateX(20), 0);
        // after 1 second no acceleration
        setTimeout(() => mobileObject.accelerateX(0), 1000);
        const s = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
                acc = data.acc;
            }
        );
        setTimeout(() => {
            if (acc !== 0) {
                console.error('acceleration not as expected', acc);
                done();
                throw(new Error('acceleration not as expected'));
            }
            if (speed > 22 || speed < 18) {
                console.error('speed not as expected', speed);
                done();
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 31 || spaceTravelled < 29) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done();
                throw(new Error('spaceTravelled not as expected'));
            }
            s.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it('2.2 - accelerates on the Y axis and decelerate after 1 sec - measure after 3 seconds speed and space', done => {
        let speed = 0;
        let spaceTravelled = 0;
        let acc = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        // first accelerate +20
        setTimeout(() => mobileObject.accelerateX(20), 0);
        // after 1 second decelerate -10
        setTimeout(() => mobileObject.accelerateX(-10), 1000);
        const s = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speed = data.vel;
                spaceTravelled = data.cumulatedSpace;
                acc = data.acc;
            }
        );
        setTimeout(() => {
            if (acc !== -10) {
                console.error('acceleration not as expected', acc);
                done();
                throw(new Error('acceleration not as expected'));
            }
            if (speed > 1 || speed < -1) {
                console.error('speed not as expected', speed);
                done();
                throw(new Error('speed not as expected'));
            }
            if (spaceTravelled > 31 || spaceTravelled < 29) {
                console.error('spaceTravelled not as expected', spaceTravelled);
                done();
                throw(new Error('spaceTravelled not as expected'));
            }
            s.unsubscribe();
            done();
        }, 3000);
    }).timeout(10000);

});

describe('brakes', () => {

    it('3.1 - accelerates by half of brake deceleration and after 1 second brakes - after 2 seconds it should be still', done => {
        let speedX = 0;
        let speedY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        // accelerate by half of brake deceleration
        const acc = mobileObject.brakeDeceleration;
        setTimeout(() => mobileObject.accelerateX(acc), 0);
        setTimeout(() => mobileObject.accelerateY(acc), 0);
        // after 1 second brakes
        setTimeout(() => {console.log('brake'); mobileObject.brake(); }, 1000);
        const sX = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speedX = data.vel;
            }
        );
        const sY = mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speedY = data.vel;
            }
        );
        setTimeout(() => {
            if (speedX !== 0) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY !== 0) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            sX.unsubscribe();
            sY.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it('3.2 - accelerates by half of brake deceleration only on X and after 1 second brakes - after 2 seconds it should be still', done => {
        let speedX = 0;
        let speedY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        // accelerate by half of brake deceleration
        const acc = mobileObject.brakeDeceleration;
        setTimeout(() => mobileObject.accelerateX(acc), 0);
        // after 1 second brakes
        setTimeout(() => mobileObject.brake(), 1000);
        const sX = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speedX = data.vel;
            }
        );
        const sY = mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speedY = data.vel;
            }
        );
        setTimeout(() => {
            if (speedX !== 0) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY !== 0) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            sX.unsubscribe();
            sY.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it('3.3 - accelerates by half of brake deceleration only on Y and after 1 second brakes - after 2 seconds it should be still', done => {
        let speedX = 0;
        let speedY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        // accelerate by half of brake deceleration
        const acc = mobileObject.brakeDeceleration;
        setTimeout(() => mobileObject.accelerateY(acc), 0);
        // after 1 second brakes
        setTimeout(() => mobileObject.brake(), 1000);
        const sX = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speedX = data.vel;
            }
        );
        const sY = mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speedY = data.vel;
            }
        );
        setTimeout(() => {
            if (speedX !== 0) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY !== 0) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            sX.unsubscribe();
            sY.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it('3.4 - accelerates by 1 and after 1 second brakes - after 2 seconds it should be still', done => {
        let speedX = 0;
        let speedY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        // accelerate by half of brake deceleration
        const acc = 1;
        setTimeout(() => mobileObject.accelerateX(acc), 0);
        setTimeout(() => mobileObject.accelerateY(acc), 0);
        // after 1 second brakes
        setTimeout(() => mobileObject.brake(), 1000);
        const sX = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speedX = data.vel;
            }
        );
        const sY = mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speedY = data.vel;
            }
        );
        setTimeout(() => {
            if (speedX !== 0) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY !== 0) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            sX.unsubscribe();
            sY.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it('3.5 - accelerates by 1000 and after 1 second brakes - after 2 seconds it should not be still', done => {
        let speedX = 0;
        let speedY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        const acc = 1000;
        setTimeout(() => mobileObject.accelerateX(acc), 0);
        setTimeout(() => mobileObject.accelerateY(acc), 0);
        // after 1 second brakes
        setTimeout(() => mobileObject.brake(), 1000);
        const sX = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speedX = data.vel;
            }
        );
        const sY = mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speedY = data.vel;
            }
        );
        setTimeout(() => {
            if (speedX < 100) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY < 100) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            sX.unsubscribe();
            sY.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it(`3.6 - accelerates by 100 and after 1 second brakes - after 1.5 accelerates negative by -200
        after 3 seconds it should still move approximatively with a speed of 50`, done => {
        let speedX = 0;
        let speedY = 0;
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        const acc = 100;
        setTimeout(() => mobileObject.accelerateX(acc), 0);
        setTimeout(() => mobileObject.accelerateY(acc), 0);
        // after 1 second brakes
        setTimeout(() => mobileObject.brake(), 1000);
        // after 1.5 second accelerate negative by -1
        setTimeout(() => {
            mobileObject.accelerateX(-2 * acc);
            mobileObject.accelerateY(-2 * acc);
        }, 1500);
        const sX = mobileObject.dynamicsObsX
        .subscribe(
            data => {
                speedX = data.vel;
            }
        );
        const sY = mobileObject.dynamicsObsY
        .subscribe(
            data => {
                speedY = data.vel;
            }
        );
        setTimeout(() => {
            console.log('speedX is ', speedX);
            console.log('speedY is ', speedY);
            if (speedX > -230) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY > -230) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            sX.unsubscribe();
            sY.unsubscribe();
            done();
        }, 3000);
    }).timeout(10000);

});

describe('accelerate brake and then pedal up', () => {

    it(`4.1 - accelerates a mobile object for 1 sec, then brakes and then after another second release the pedal
         since the acceleration given at the beggining is bigger than the deceleration of the brake
         after 2 seconds the speed should be still positive`, done => {
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        const acceleration = mobileObject.brakeDeceleration * 2;
        let speedX = 0;
        let speedY = 0;
        mobileObject.accelerateX(acceleration);
        mobileObject.accelerateY(acceleration);
        // after 1 second brakes
        setTimeout(() => mobileObject.brake(), 1000);
        // after 2 seconds release the pedal
        setTimeout(() => mobileObject.pedalUp(), 2000);
        const expectedVelAfter2Sec = acceleration / 2; // deceleration of brake is half of acceleration
        const s = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
            }
        );
        setTimeout(() => {
            if (speedX > expectedVelAfter2Sec * 1.1 || speedX < expectedVelAfter2Sec * 0.9) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY > expectedVelAfter2Sec * 1.1 || speedY < expectedVelAfter2Sec * 0.9) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            s.unsubscribe();
            done();
        }, 2500);
    }).timeout(10000);

});

describe('check if this is an HOT observable', () => {

    it(`5.1 - a client subscribes to a mobile ojiect, then unsubscribes after 1 sec and then subscribes again after 2 sec
        since the Observable is HOT, it has continued to move even during the period where it was unsubscribed`, done => {
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        const acceleration = 50;
        let speedX = 0;
        let speedY = 0;
        let spaceX = 0;
        let spaceY = 0;
        mobileObject.accelerateX(acceleration);
        mobileObject.accelerateY(acceleration);
        const subscription = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
                spaceX = data[0].cumulatedSpace;
                spaceY = data[1].cumulatedSpace;
            }
        );
        // after 1 second unsubscribe
        setTimeout(() => subscription.unsubscribe(), 1000);
        // after 2 seconds subscribes again and checks
        setTimeout(() => {
            mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY)).pipe(
                take(1),
            )
            .subscribe(
                data => {
                    speedX = data[0].vel;
                    speedY = data[1].vel;
                    spaceX = data[0].cumulatedSpace;
                    spaceY = data[1].cumulatedSpace;
                    console.log('speedX after 2 seconds at second subscribe', speedX);
                    console.log('speedY after 2 seconds at second subscribe', speedY);
                    console.log('spaceX after 2 seconds at second subscribe', spaceX);
                    console.log('spaceY after 2 seconds at second subscribe', spaceY);
                    if (spaceX > 101 || spaceX < 99 || spaceY > 101 || spaceY < 99) {
                        console.error('spaceX or spaceY not as expected', spaceX, spaceY);
                        done();
                        throw(new Error('spaceX or spaceY not as expected'));
                    }
                }
            );
            done();
        }, 2000);
    }).timeout(10000);

});

describe('turn on and off', () => {

    it(`6.1 - create a mobile object and turns it on after 1 sec`, done => {
        const mobileObject = new MobileObject(null, 0, 0, false);
        // after 1 second turns on
        setTimeout(() => mobileObject.turnOn(), 1000);
        let speedX;
        let speedY;
        const s = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
            }
        );
        // after 0.5 sec speedX and speedY are undefined
        setTimeout(() => {
            if (speedX !== undefined) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY !== undefined) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
        }, 500);
        // after 1.5 sec speedX and speedY are 0
        setTimeout(() => {
            if (speedX !== 0) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedX !== 0) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            s.unsubscribe();
            done();
        }, 1500);
    }).timeout(10000);

    it(`6.2 - create a mobile object and turns it on after 1 sec and then accelerates`, done => {
        const mobileObject = new MobileObject();
        let speedX;
        let speedY;
        const acceleration = 100;
        // after 1 second turns on and accelerates
        setTimeout(() => {
            mobileObject.turnOn();
            mobileObject.accelerateX(acceleration);
            mobileObject.accelerateY(acceleration);
        }, 1000);
        const s = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
            }
        );
        // after 2 secs speedX and speedY are about 100
        setTimeout(() => {
            if (speedX < 97 || speedX > 103) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY < 97 || speedY > 103) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            s.unsubscribe();
            done();
        }, 2000);
    }).timeout(10000);

    it(`6.3 - create a mobile object and turns it on after 1 sec and then accelerates
        and then turns it off after 2 seconds`, done => {
        const mobileObject = new MobileObject(null, 0, 0, false);
        let speedX;
        let speedY;
        const acceleration = 100;
        // after 1 second turns on and accelerates
        setTimeout(() => {
            mobileObject.turnOn();
            mobileObject.accelerateX(acceleration);
            mobileObject.accelerateY(acceleration);
        }, 1000);
        // after 2 seconds turns off
        setTimeout(() => {
            mobileObject.turnOff();
        }, 2000);
        const s = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
            }
        );
        // take speedX and seepdY after 2.1 secs
        let speed2secX;
        let speed2secY;
        setTimeout(() => {
            speed2secX = speedX;
            speed2secY = speedY;
        }, 2100);
        // after 3 secs speedX and speedY have the same value as after 2.1 seconds since no emission happened after turn off
        setTimeout(() => {
            if (speedX !== speed2secX) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY !== speed2secY) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            s.unsubscribe();
            done();
        }, 3000);
    }).timeout(10000);

    it(`6.4 - turns on, after 1 sec turns off, after 2 secs turns on again`, done => {
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        let speedX;
        let speedY;
        let spaceX;
        let spaceY;
        const acceleration = 100;
        mobileObject.accelerateX(acceleration);
        mobileObject.accelerateY(acceleration);
        // after 1 second turns off
        setTimeout(() => {
            mobileObject.turnOff();
        }, 1000);
        // after 2 seconds turns on again
        setTimeout(() => {
            mobileObject.turnOn();
        }, 2000);
        const s = mobileObject.dynamicsObsX.pipe(combineLatest(mobileObject.dynamicsObsY))
        .subscribe(
            data => {
                speedX = data[0].vel;
                speedY = data[1].vel;
                spaceX = data[0].cumulatedSpace;
                spaceY = data[1].cumulatedSpace;
            }
        );
        // after 3 secs speedX and speedY are as the mobile object was on for 2 secs with an acceleation of 100
        setTimeout(() => {
            if (speedX < 190 || speedX > 210) {
                console.error('speedX not as expected', speedX);
                done();
                throw(new Error('speedX not as expected'));
            }
            if (speedY < 190 || speedY > 210) {
                console.error('speedY not as expected', speedY);
                done();
                throw(new Error('speedY not as expected'));
            }
            if (spaceX < 190 || spaceX > 210) {
                console.error('spaceX not as expected', speedY);
                done();
                throw(new Error('spaceX not as expected'));
            }
            if (spaceY < 190 || spaceY > 210) {
                console.error('spaceY not as expected', speedY);
                done();
                throw(new Error('spaceY not as expected'));
            }
            s.unsubscribe();
            done();
        }, 3000);
    }).timeout(10000);

    it(`6.5 - isTurnedOn obsersvable`, done => {
        const mobileObject = new MobileObject();
        mobileObject.turnOn();
        let tOn;
        const s = mobileObject.isTurnedOnObs.subscribe(
            turnedOn => tOn = turnedOn
        )
        setTimeout(() => {
            if (!tOn) {
                console.error('turnedOn not as expected', tOn);
                done();
                throw(new Error('turnedOn not as expected'));
            }
        }, 100);
        // after 1 second turns off
        setTimeout(() => {
            mobileObject.turnOff();
        }, 1000);
        // after 1.5 seconds checks if turned on
        setTimeout(() => {
            if (tOn) {
                console.error('turnedOn not as expected', tOn);
                done();
                throw(new Error('turnedOn not as expected'));
            }
        }, 1500);
        // after 2 second turns on again
        setTimeout(() => {
            mobileObject.turnOn();
        }, 2000);
        // after 2.5 seconds checks if turned on
        setTimeout(() => {
            if (!tOn) {
                console.error('turnedOn not as expected', tOn);
                done();
                throw(new Error('turnedOn not as expected'));
            }
            s.unsubscribe();
            done();
        }, 2500);
    }).timeout(10000);

});


import { timer } from 'rxjs';
import { tap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { share } from 'rxjs/operators';
function timeFrames(interval: number, numberOfFrames: number) {
    const clock = timer(0, interval).pipe(take(numberOfFrames));

    let t0 = Date.now();
    let t1: number;
    const obsTime = clock.pipe(
        tap(() => t1 = Date.now()),
        map(() => t1 - t0),
        tap(() => t0 = t1),
        share()
    );

    return obsTime;
}
