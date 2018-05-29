"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const rxjs_2 = require("rxjs");
const rxjs_3 = require("rxjs");
const operators_1 = require("rxjs/operators");
const operators_2 = require("rxjs/operators");
// import {skipWhile} from 'rxjs/operators';
// import {switchMap} from 'rxjs/operators';
const skip_toggle_1 = require("./skip-toggle");
function skipToggleReply(toggle) {
    console.log('skipToggleReply');
    const replaySubject = new rxjs_1.ReplaySubject(1);
    return (source) => {
        const s = source.pipe(operators_2.share(), skip_toggle_1.skipToggle(toggle));
        s.subscribe(d => replaySubject.next(d), err => replaySubject.error(err), () => replaySubject.complete());
        return replaySubject.asObservable();
    };
}
exports.skipToggleReply = skipToggleReply;
function skipToggleReply1(toggle) {
    // const undefinedSymbol = Symbol('UNDEFINED');
    // let replayValue: symbol | T = undefinedSymbol;
    console.log('skipToggleReply');
    let replayValue;
    // if (replayValue === undefined) {
    //     console.log('skipToggleReply IF');
    //     return (source: Observable<T>) =>
    //         source.pipe(
    //             tap(d => console.log('tap if', d, replayValue)),
    //             share(),
    //             tap(d => replayValue = d),
    //             skipToggle(toggle),
    //         );
    // }
    return (source) => {
        const s = source.pipe(operators_1.tap(d => console.log('tap NOT IF', d, replayValue)), operators_2.share(), operators_1.tap(d => replayValue = d), skip_toggle_1.skipToggle(toggle));
        return rxjs_3.concat(rxjs_2.of(replayValue), s);
    };
}
exports.skipToggleReply1 = skipToggleReply1;
//# sourceMappingURL=skip-toggle-reply.js.map