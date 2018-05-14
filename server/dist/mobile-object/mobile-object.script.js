"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { take } from 'rxjs/operators';
const operators_1 = require("rxjs/operators");
const mobile_object_1 = require("./mobile-object");
const mobileObject = new mobile_object_1.MobileObject();
mobileObject.turnOn();
const acceleration = 100;
let speedX = 0;
let speedY = 0;
let spaceX = 0;
let spaceY = 0;
mobileObject.accelerateX(acceleration);
mobileObject.accelerateY(acceleration);
mobileObject.dynamicsObsX.pipe(operators_1.combineLatest(mobileObject.dynamicsObsY))
    .subscribe(data => {
    speedX = data[0].vel;
    speedY = data[1].vel;
    spaceX = data[0].cumulatedSpace;
    spaceY = data[1].cumulatedSpace;
});
// after 1 second turn off
setTimeout(() => {
    mobileObject.turnOff();
}, 1000);
// check speed and space after 2 seconds
setTimeout(() => {
    console.log('speedX after 2 seconds', speedX);
    console.log('speedY after 2 seconds', speedY);
    console.log('spaceX after 2 seconds', spaceX);
    console.log('spaceY after 2 seconds', spaceY);
}, 2000);
// after 2 seconds turn on
setTimeout(() => {
    mobileObject.turnOn();
}, 2000);
// check speed and space after 2 seconds
setTimeout(() => {
    console.log('speedX after 3 seconds', speedX);
    console.log('speedY after 3 seconds', speedY);
    console.log('spaceX after 3 seconds', spaceX);
    console.log('spaceY after 3 seconds', spaceY);
}, 3000);
//# sourceMappingURL=mobile-object.script.js.map