"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const rxjs_1 = require("rxjs");
const server_multi_object_1 = require("./server-multi-object");
const socket_obs_test_1 = require("./socket-obs.test");
const operators_1 = require("rxjs/operators");
// import {MessageType} from './server-multi-object';
// import {MobileObjectCommand} from './server-multi-object';
const server_multi_object_2 = require("./server-multi-object");
describe('0 - lifecycle of a Controller', () => {
    it(`0.1 - connect a Controller to a MobileObjectServer and check that 1 MobileObject has been created and that it is turned off
                after some time the Controller disconnects and the MobileObject should be deleted from the server`, done => {
        const sockets = new rxjs_1.Subject();
        const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
        mobileObjectServer.start(sockets);
        // a socket connects to the Server - it will later be bound as Controller
        const controllerSocket = socket_obs_test_1.socketConnected(sockets);
        let mobileObjectId;
        controllerSocket.sendSubject
            .pipe(
        // take the first message sent, since this is the one containing the id of the MobileObject
        operators_1.take(1))
            .subscribe(message => mobileObjectId = message.message);
        // emits to simulate that a BIND_CONTROLLER has been received over this socket
        controllerSocket.bindAsController();
        setTimeout(() => {
            if (!mobileObjectId) {
                const err = '0.1 - No mobileObject it returned from server';
                console.error(err);
                done();
                throw (new Error(err));
            }
            mobileObjectServer.getMobileObject(mobileObjectId).isTurnedOnObs.subscribe(isTurnedOn => {
                if (isTurnedOn) {
                    const err = '0.1 - MobileObject should be turned off';
                    console.error(err);
                    done();
                    throw (new Error(err));
                }
            });
            if (mobileObjectServer.getMobileObjects().size !== 1) {
                const err = '0.1 - There should be only 1 MobileObject running in the server';
                console.error(err);
                done();
                throw (new Error(err));
            }
            // emits again to simulate that a BIND_CONTROLLER has been received over this socket - nothing should happen
            controllerSocket.bindAsController();
            controllerSocket.sendSubject
                .subscribe(message => {
                const err = '0.1 - No message should be received but one message has been received: ' + message;
                console.error(err);
                done();
                throw (new Error(err));
            });
        }, 50);
        setTimeout(() => {
            console.log('disconnect');
            // simulates disconnection
            controllerSocket.disconnect();
        }, 170);
        setTimeout(() => {
            if (mobileObjectServer.getMobileObjects().size !== 0) {
                const err = '0.1 - There should be no MobileObject running in the server';
                console.error(err);
                done();
                throw (new Error(err));
            }
            done();
        }, 180);
    }).timeout(10000);
    it(`0.2 - connect a Controller to a MobileObjectServer and then a Monitor connects
                at which point the Monitor receives a message that a Controller is already running on the server
                after some time the sockets are disconnected`, done => {
        const sockets = new rxjs_1.Subject();
        const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
        mobileObjectServer.start(sockets);
        // a socket connects to the Server - it will later be bound as Controller
        const controllerSocket = socket_obs_test_1.socketConnected(sockets);
        // emits to simulate that a BIND_CONTROLLER has been received over this socket
        controllerSocket.bindAsController();
        let controllerId;
        // after some time a Monitor connects to the Server
        // a socket connects to the Server - it will later be bound as Monitor
        const monitorSocket = socket_obs_test_1.socketConnected(sockets);
        monitorSocket.sendSubject
            .subscribe(data => controllerId = data.message);
        setTimeout(() => {
            monitorSocket.bindAsMonitor();
        }, 150);
        setTimeout(() => {
            if (!controllerId) {
                const err = '0.2 - There controllerId should have been received';
                console.error(err);
                done();
                throw (new Error(err));
            }
            // there shuld be 1 MobileObject running on the server since 1 has connected
            if (mobileObjectServer.getMobileObjects().size !== 1) {
                const err = '0.2 - There should be 1 MobileObject running in the server';
                console.error(err);
                done();
                throw (new Error(err));
            }
        }, 250);
        setTimeout(() => {
            console.log('sockets disconnected');
            // simulates disconnection
            monitorSocket.disconnect();
            controllerSocket.disconnect();
        }, 470);
        setTimeout(() => {
            done();
        }, 480);
    }).timeout(10000);
    it(`0.3 - connect a Controller to a MobileObjectServer and then a Monitor connects
                after this the MobileObject is turned
                the Controller gets the turnedOn message while the Monitor starts getting data about dynamics
                after some time the sockets are disconnected`, done => {
        const sockets = new rxjs_1.Subject();
        const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
        mobileObjectServer.start(sockets);
        // a socket connects to the Server - it will later be bound as Controller
        let messageForController;
        let mobileObjectId;
        const controllerSocket = socket_obs_test_1.socketConnected(sockets);
        controllerSocket.sendSubject.subscribe(data => messageForController = data.message);
        controllerSocket.sendSubject.pipe(operators_1.take(1)).subscribe(data => mobileObjectId = data.message);
        // emits to simulate that a BIND_CONTROLLER has been received over this socket
        controllerSocket.bindAsController();
        // a socket connects to the Server - it will later be bound as Monitor
        let messageForMonitor;
        const monitorSocket = socket_obs_test_1.socketConnected(sockets);
        monitorSocket.sendSubject.subscribe(data => messageForMonitor = data.message);
        // after some time a Monitor connects to the Server
        setTimeout(() => {
            monitorSocket.bindAsMonitor();
        }, 150);
        // after the Controller sends the turnOn command to its MobileObject
        setTimeout(() => {
            const command = { action: server_multi_object_2.MobileObjectCommand.TURN_ON };
            controllerSocket.sendCommand(command);
        }, 250);
        setTimeout(() => {
            if (!messageForController) {
                const err = '0.3 - There controller should have received a TURNED_ON true message';
                console.error(err);
                done();
                throw (new Error(err));
            }
            if (messageForMonitor !== mobileObjectId) {
                const err = '0.3 - There mobileObjectId should be the same on the Controller and on the Monitor';
                console.error(err, mobileObjectId, messageForMonitor);
                done();
                throw (new Error(err));
            }
        }, 350);
        setTimeout(() => {
            console.log('sockets disconnected');
            // simulates disconnection
            monitorSocket.disconnect();
            controllerSocket.disconnect();
        }, 470);
        setTimeout(() => {
            done();
        }, 480);
    }).timeout(10000);
});
describe('1 - lifecycle of a Monitor', () => {
    it(`1.1 - connect a Monitor to a MobileObjectServer and check that the monitorId is sent
                after some time the Monitor disconnects`, done => {
        const sockets = new rxjs_1.Subject();
        const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
        mobileObjectServer.start(sockets);
        // a socket connects to the Server - it will later be bound as Monitor
        const monitorSocket = socket_obs_test_1.socketConnected(sockets);
        let monitorId;
        monitorSocket.sendSubject
            .subscribe(data => monitorId = data.message);
        // emits to simulate that a BIND_MONITOR has been received over this socket
        monitorSocket.bindAsMonitor();
        setTimeout(() => {
            if (!monitorId) {
                const err = '1.1 - No monitorId it returned from server';
                console.error(err);
                done();
                throw (new Error(err));
            }
        }, 50);
        setTimeout(() => {
            console.log('monitorSocket disconnect');
            // simulates disconnection
            monitorSocket.disconnect();
        }, 1170);
        setTimeout(() => {
            done();
        }, 1180);
    }).timeout(10000);
    it(`1.2 - connect a Monitor to a MobileObjectServer and then a Controller connects
                at which point the Monitor receives a message that a Controller has connected
                after some time the sockets are disconnected`, done => {
        const sockets = new rxjs_1.Subject();
        const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
        mobileObjectServer.start(sockets);
        // a socket connects to the Server - it will later be bound as Monitor
        const monitorSocket = socket_obs_test_1.socketConnected(sockets);
        let controllerId;
        monitorSocket.sendSubject
            .subscribe(data => controllerId = data.message);
        // emits to simulate that a BIND_MONITOR has been received over this socket
        monitorSocket.bindAsMonitor();
        // after some time a Controller connects to the Server
        const controllerSocket = socket_obs_test_1.socketConnected(sockets);
        setTimeout(() => {
            controllerSocket.bindAsController();
        }, 150);
        setTimeout(() => {
            if (!controllerId) {
                const err = '1.2 - There controllerId should have been received';
                console.error(err);
                done();
                throw (new Error(err));
            }
            // there shuld be 1 MobileObject running on the server since 1 has connected
            if (mobileObjectServer.getMobileObjects().size !== 1) {
                const err = '1.2 - There should be 1 MobileObject running in the server';
                console.error(err);
                done();
                throw (new Error(err));
            }
        }, 250);
        setTimeout(() => {
            console.log('sockets disconnected');
            // simulates disconnection
            monitorSocket.disconnect();
            controllerSocket.disconnect();
        }, 1270);
        setTimeout(() => {
            done();
        }, 1280);
    }).timeout(10000);
});
describe('X - requests to bind as Monitor or Controller are sent erroneously', () => {
    it(`X.1 - a Monitor connects to the server and then by mistake sends a request to connect as Controller`, done => {
        const sockets = new rxjs_1.Subject();
        const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
        mobileObjectServer.start(sockets);
        const monitorSocket = socket_obs_test_1.socketConnected(sockets);
        monitorSocket.sendSubject
            .subscribe(d => console.log('=========================monitorSocket.sendSubject', d));
        // emits to simulate that a BIND_MONITOR has been received over this socket
        monitorSocket.bindAsMonitor();
        // after some time a second erroneous request to connect as Controller is sent over the same socket which previously connected 
        // as monitor
        setTimeout(() => {
            monitorSocket.bindAsMonitor();
        }, 100);
        setTimeout(() => {
            // there shuld be no MobileObject running on the server since the client should be a Monitor
            if (mobileObjectServer.getMobileObjects().size !== 0) {
                const err = 'X.1 - There should be no MobileObject running in the server';
                console.error(err);
                done();
                throw (new Error(err));
            }
        }, 150);
        setTimeout(() => {
            console.log('monitorSocket disconnect');
            // simulates disconnection
            monitorSocket.disconnect();
        }, 2170);
        setTimeout(() => {
            done();
        }, 2180);
    }).timeout(10000);
});
//# sourceMappingURL=server-multi-object.spec.js.map