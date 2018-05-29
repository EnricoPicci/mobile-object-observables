"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import {of} from 'rxjs';
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
const operators_3 = require("rxjs/operators");
const operators_4 = require("rxjs/operators");
function skipToggle(toggle) {
    let togValue;
    return (source) => toggle.pipe(operators_1.tap(t => togValue = t), operators_4.switchMap(() => source.pipe(operators_2.share(), operators_3.skipWhile(() => !togValue))));
}
exports.skipToggle = skipToggle;
//# sourceMappingURL=skip-toggle.js.map