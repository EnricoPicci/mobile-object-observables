
import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs/operators';

import {MobileObject} from './mobile-object';

        const mobileObject = new MobileObject();
        const acceleration = 50;
        let speedX = 0;
        let speedY = 0;
        let spaceX = 0;
        let spaceY = 0;
        mobileObject.accelerateX(acceleration);
        mobileObject.accelerateY(acceleration);
        const subscription = mobileObject.deltaSpaceObsX.pipe(combineLatest(mobileObject.deltaSpaceObsY))
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
        // check speed and space after 1 seconds
        setTimeout(() => {
            console.log('speedX after 1 seconds', speedX);
            console.log('speedY after 1 seconds', speedY);
            console.log('spaceX after 1 seconds', spaceX);
            console.log('spaceY after 1 seconds', spaceY);
        }, 1000);
        // after 2 seconds subscribes again and checks
        setTimeout(() => {
            mobileObject.deltaSpaceObsX.pipe(combineLatest(mobileObject.deltaSpaceObsY)).pipe(
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
                        throw(new Error('spaceX or spaceY not as expected'));
                    }
                }
            );
        }, 2000);
