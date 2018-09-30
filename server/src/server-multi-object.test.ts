// these are tests at the boundaries of the Server
// it assumes a Server is running
// start server with the command "node ./dist/index"

import { Observable } from 'rxjs';
import { tap, delay } from 'rxjs/operators';
import { switchMap, mergeMap } from 'rxjs/operators';
import { map } from 'rxjs/operators';
import { take } from 'rxjs/operators';
import { share } from 'rxjs/operators';
import { skip } from 'rxjs/operators';
import { filter } from 'rxjs/operators';

import {SocketObs} from './socket-obs';
import {MessageType} from './server-multi-object';
import {MobileObjectCommand, MobileObjectCommandMessage} from './server-multi-object';

const socketServerUrl = 'http://localhost:8081';

// =====================================================================================================================
// ===================================== Utility functions for the tests ===============================================
// =====================================================================================================================

// Utility functions used in the tests
const connectControllerToServer = () => {
    const socketClientObs = new SocketObs(socketServerUrl);
    const messageObservable = socketClientObs.onConnect().pipe(
        tap(() => console.log('Controller connected')),
        tap(() => socketClientObs.send(MessageType.BIND_CONTROLLER)),
        switchMap(() => socketClientObs.onMessageType(MessageType.MOBILE_OBJECT)),
    );
    return {socketClientObs, messageObservable};
}
const connectMonitorToServer = () => {
    const socketClientObs = new SocketObs(socketServerUrl);
    const messageObservable =  socketClientObs.onConnect().pipe(
        tap(() => console.log('Monitor connected')),
        tap(() => socketClientObs.send(MessageType.BIND_MONITOR)),
        switchMap(() => socketClientObs.onMessageType(MessageType.MOBILE_OBJECT)),
    );
    return {socketClientObs, messageObservable};
}
// =====================================================================================================================
// ===================================== END Utility functions for the tests ===========================================
// =====================================================================================================================

// TEST 1
// A Controller connects to the Server and tells the server that is a controller - the Server sends the MobileObjectId

const controllerConnectsToServer = () => {
    return connectControllerToServer();
}
const controllerConnectsToServerTest = () => {
    const connectionData = controllerConnectsToServer();
    connectionData.messageObservable.pipe(
        take(1), // to terminate the Observable returned by controllerConnectsToServer()
    )
    .subscribe(
        mobileObjectId => {
            if (!mobileObjectId) {
                console.error('TEST 1 - mobileObjectId not received');
            } else {
                console.log('TEST 1 passed');
            }
            connectionData.socketClientObs.close();
        }
    )
}
controllerConnectsToServerTest();

// TEST 2
// A Controller connects to the Server and then listens if the MobileObject is turneOn
// Test that the MobileObject is turned off since it has not been yet turned on
const mobileObjectNotTurnedOnTest = () => {
    const connectionData = connectControllerToServer();
    const socketClientObs = connectionData.socketClientObs;
    connectionData.messageObservable
    .pipe(
        switchMap(mobObjId => socketClientObs.onMessageType(MessageType.TURNED_ON + mobObjId)),
        map(turnedOn => JSON.parse(turnedOn)),
        take(1), // to terminate the Observable returned by mobileObjectTurnedOn()
    )
    .subscribe(
        turnedOn => {
            if (turnedOn) {
                console.error('TEST 2 - mobileObjectId should be turned off');
            } else {
                console.log('TEST 2 - passed');
            }
            socketClientObs.close();
        }
    )
}
mobileObjectNotTurnedOnTest();

// TEST 3
// A Controller connects to the Server and then turns on the MobileObject
// Test that the MobileObject is turned on
const mobileObjectTurnedOnTest = () => {
    const connectionData = connectControllerToServer();
    const socketClientObs = connectionData.socketClientObs;
    connectionData.messageObservable
    .pipe(
        switchMap(mobObjId => socketClientObs.onMessageType(MessageType.TURNED_ON + mobObjId)),
        tap(() => {
            const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
            setTimeout(() => {
                socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
            }, 300);
        }),
        map(turnedOn => JSON.parse(turnedOn)),
        skip(1), // skips the first message which is returned when the MobileObject is created and which contains "false"
        take(1), // to terminate the Observable returned by mobileObjectTurnedOn()
    )
    .subscribe(
        turnedOn => {
            if (!turnedOn) {
                console.error('TEST 3 - mobileObjectId not turned on');
            } else {
                console.log('TEST 3 - passed');
            }
            socketClientObs.close();
        }
    )
}
mobileObjectTurnedOnTest();

// TEST 4
// A Controller connects to the Server and then first turns the MobileObject on and then it turns it off
// Test that the server sends to the client events when the MobileObject is turned off
const mobileObjectTurnedOnAndOffTest = () => {
    const connectionData = connectControllerToServer();
    const socketClientObs = connectionData.socketClientObs;
    connectionData.messageObservable
    .pipe(        
        switchMap(mobObjId => socketClientObs.onMessageType(MessageType.TURNED_ON + mobObjId)),
        tap(() => {
            const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
            setTimeout(() => {
                socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
            }, 400);
        }),
        tap(() => {
            const turnOffCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_OFF};
            setTimeout(() => {
                socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOffCommand)
            }, 410);
        }),
        map(turnedOn => JSON.parse(turnedOn)),
        skip(2), // skips the first 2 messages: the first is returned when the MobileObject is created, the second when
                 // it is turned on
        take(1), // to terminate the Observable
    )
    .subscribe(
        turnedOn => {
            if (turnedOn) {
                console.error('TEST 4 - mobileObjectId should be turned off');
            } else {
                console.log('TEST 4 - passed');
            }
            socketClientObs.close();
        },
        err => console.log('TEST 4 - Obs error', err),
        () => console.log('TEST 4 - Obs complete') // this function is hit since we have the 'take(1)' operator which completes the Observable
    )
}
mobileObjectTurnedOnAndOffTest();


// TEST 5
// A Controller connects to the Server and then turns its MobileObject on
// A second Controller connects to the Server and does nothing
// After some time the first one is turned off while the second one is turned on
// Test that, after all these things happened, the first receives a 'turnedOff' message from the Server
// while the second one receives a 'turnedOn' message from the server
const mobileObject_1_Test5 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
    }, 500);
    setTimeout(() => {
        const turnOffCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_OFF};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOffCommand)
    }, 510);
    return connectionData.messageObservable.pipe(
        switchMap(mobObjId => connectionData.socketClientObs.onMessageType(MessageType.TURNED_ON + mobObjId)),
        map(turnedOn => JSON.parse(turnedOn))
    );
}
const mobileObject_2_Test5 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
    }, 510);
    return connectionData.messageObservable.pipe(
        switchMap(mobObjId => connectionData.socketClientObs.onMessageType(MessageType.TURNED_ON + mobObjId)),
        map(turnedOn => JSON.parse(turnedOn))
    );
}
const twoMobileObjectsTurnedOnAndOffTest = () => {
    let isMobObj_1_turnedOn;
    let isMobObj_2_turnedOn;
    const connectionData_1 = connectControllerToServer();
    const socketClientObs_1 = connectionData_1.socketClientObs;
    const connectionData_2 = connectControllerToServer();
    const socketClientObs_2 = connectionData_2.socketClientObs;
    mobileObject_1_Test5(connectionData_1)
    .subscribe(
        turnedOn => isMobObj_1_turnedOn = turnedOn,
    );
    mobileObject_2_Test5(connectionData_2)
    .subscribe(
        turnedOn => isMobObj_2_turnedOn = turnedOn,
    );
    setTimeout(() => {
        if (isMobObj_1_turnedOn) {
            console.error('TEST 5_1 - the first mobile object should be turned off');
        }
        if (!isMobObj_2_turnedOn) {
            console.error('TEST 5_2 - the second mobile object should be turned on');
        }
        if (!isMobObj_1_turnedOn && isMobObj_2_turnedOn) {
            console.log('TEST 5 passed')
        }
        socketClientObs_1.close();
        socketClientObs_2.close();
    }, 520);
}
twoMobileObjectsTurnedOnAndOffTest();


// TEST 7
// 2 Controllers connect to the Server and then turn their respective MobileObjects on
// The first one accelerates positively on the X axis, while the second accelerates negatively on the X axis
// A Monitor also connect to the Server
// Test that after some time the Monitor receives posite velocity for the first one and negative for the second
let mobObjId_1_Test7;
let mobObjId_2_Test7;
const controller_1_Test7 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
    }, 700);
    setTimeout(() => {
        const accelerateCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.ACCELERATE_X, value: 100};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, accelerateCommand)
    }, 710);
    connectionData.messageObservable.pipe(
        tap(id => mobObjId_1_Test7 = id)
    )
    .subscribe();
}
const controller_2_Test7 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
    }, 700);
    setTimeout(() => {
        const accelerateCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.ACCELERATE_X, value: -100};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, accelerateCommand)
    }, 710);
    connectionData.messageObservable.pipe(
        tap(id => mobObjId_2_Test7 = id)
    )
    .subscribe();
}
const twoMobileObjectsWithMonitorTest = () => {
    let mobObj_1_Dynamics;
    let mobObj_2_Dynamics;
    const connectionControllerData_1 = connectControllerToServer();
    const socketClientControllerObs_1 = connectionControllerData_1.socketClientObs;
    const connectionControllerData_2 = connectControllerToServer();
    const socketClientControllerObs_2 = connectionControllerData_2.socketClientObs;
    controller_1_Test7(connectionControllerData_1);
    controller_2_Test7(connectionControllerData_2);
    const connectionMonitorData = connectMonitorToServer();
    connectionMonitorData.messageObservable
    .pipe(
        filter(id => id === mobObjId_1_Test7), // take the first MobileObject, i.e. the one with positive acceleration
        switchMap(mobObjId => connectionMonitorData.socketClientObs.onMessageType(MessageType.DYNAMICS_INFO + mobObjId)),
        map(dynamics => JSON.parse(dynamics)),
        map(dynamics => dynamics[0]) // take the X axis
    )
    .subscribe(
        dynamics => mobObj_1_Dynamics = dynamics,
    );
    connectionMonitorData.messageObservable
    .pipe(
        filter(id => id === mobObjId_2_Test7), // take the second MobileObject, i.e. the one with negative acceleration
        switchMap(mobObjId => connectionMonitorData.socketClientObs.onMessageType(MessageType.DYNAMICS_INFO + mobObjId)),
        map(dynamics => JSON.parse(dynamics)),
        map(dynamics => dynamics[0]) // take the X axis
    )
    .subscribe(
        dynamics => mobObj_2_Dynamics = dynamics,
    );
    setTimeout(() => {
        if (!mobObj_1_Dynamics) {
            console.error('TEST 7_1 - the dynamics mobile object 1 should be defined');
        }
        if (!mobObj_2_Dynamics) {
            console.error('TEST 7_2 - the dynamics mobile object 2 should be defined');
        }
        if (mobObj_1_Dynamics.vel <= 0) {
            console.error('TEST 7_1 - the first mobile object should have positive velocity');
        }
        if (mobObj_2_Dynamics.vel >= 0) {
            console.error('TEST 7_2 - the first mobile object should have negative velocity');
        }
        if (mobObj_1_Dynamics.vel > 0 && mobObj_2_Dynamics.vel < 0) {
            console.log('TEST 7 passed')
        }
        socketClientControllerObs_1.close();
        socketClientControllerObs_2.close();
        connectionMonitorData.socketClientObs.close();
    }, 790);
}
twoMobileObjectsWithMonitorTest();


// TEST 9
// One Controller connects to the Server, turns its MobileObject on, accelerates and then brakes
// Later a Monitor connects to the Server
// Test that after some time the Monitor sees that the MobileObject has stopped moving (as a result of the brake)
let mobObjId_Test9;
const controller_Test9 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
    }, 900);
    setTimeout(() => {
        const accelerateCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.ACCELERATE_X, value: 100};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, accelerateCommand)
    }, 901);
    setTimeout(() => {
        const brakeCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.BRAKE};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, brakeCommand)
    }, 950);
    connectionData.messageObservable.pipe(
        tap(id => mobObjId_Test9 = id)
    )
    .subscribe();
}
const mobileObjectBrakesWithMonitorTest = () => {
    let mobObj_Dynamics;
    const connectionControllerData = connectControllerToServer();
    const socketClientControllerObs = connectionControllerData.socketClientObs;
    controller_Test9(connectionControllerData);
    let connectionMonitorData: {socketClientObs: SocketObs, messageObservable: Observable<any>};
    setTimeout(() => {
        connectionMonitorData = connectMonitorToServer();
        connectionMonitorData.messageObservable
        .pipe(
            filter(id => id === mobObjId_Test9), // take the MobileObject created for this test
            switchMap(mobObjId => connectionMonitorData.socketClientObs.onMessageType(MessageType.DYNAMICS_INFO + mobObjId)),
            map(dynamics => JSON.parse(dynamics)),
            map(dynamics => dynamics[0]) // take the X axis
        )
        .subscribe(
            dynamics => mobObj_Dynamics = dynamics,
        );
    }, 10);
    let firstCheckPassed = true;
    let secondCheckPassed = true;
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 9 step 1 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel <= 0) {
            firstCheckPassed = false;
            console.error('TEST 9 - the mobile object should have positive velocity');
        }
    }, 951);
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 9 step 2 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel !== 0) {
            secondCheckPassed = false;
            console.error('TEST 9 - the mobile object should be still after some time');
        }
        if (firstCheckPassed && secondCheckPassed) {
            console.log('TEST 9 passed')
        }
        socketClientControllerObs.close();
        connectionMonitorData.socketClientObs.close();
    }, 999);
}
mobileObjectBrakesWithMonitorTest();


// TEST 10
// Like TEST 9 with the only difference that now first we connect the Monitor and then the Controller
// so the MobileObject is created after the Monitor is already connected
// The construction of this test is a bit more cumbersome than the previous ones, so look at the 
// varioius "build phase 1, 2 and 3" described
let mobObjId_Test10;
const controller_Test10 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand)
    }, 1000);
    setTimeout(() => {
        const accelerateCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.ACCELERATE_X, value: 100};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, accelerateCommand)
    }, 1001);
    setTimeout(() => {
        const brakeCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.BRAKE};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, brakeCommand)
    }, 1050);
    connectionData.messageObservable.pipe(
        tap(id => mobObjId_Test10 = id)
    )
    .subscribe();
}
const monitorConnectsAndThenControllerTest = () => {
    let mobObj_Dynamics;
    // TEST 10 - build phase 1
    // connect the Monitor to the server
    const connectionMonitorData = connectMonitorToServer();
    const monitorSharedMessageObs = connectionMonitorData.messageObservable.pipe(
        // create a stream of objects {mobObjId, dynamics} creating the dynamics info for all
        // mobile objects active on the server - this is needed since we want, later in the test
        // (i.e. in "TEST 10 - build phase 3"), filter the dynamics info only of the mobile object 
        // which will be created by the Controller we are going to connect later in this test 
        // (i.e. in "TEST 10 - build phase 2")
        // At this point in time we do not know the id of such Controller that has to be created
        // and therefore we can not filter here
        mergeMap(mobObjId => connectionMonitorData.socketClientObs.onMessageType(MessageType.DYNAMICS_INFO + mobObjId).pipe(
            map(dynamics => ({mobObjId, dynamics}))
        )),
        // we share since we want to use the same subscription later in in "TEST 10 - build phase 3"
        // when we filter for the Mobile Object id which will be created by the Controller 
        // which we are going to create later in (i.e. in "TEST 10 - build phase 2")
        share()
    );
    monitorSharedMessageObs.subscribe();
    // TEST 10 - build phase 2
    // later connect the Controller
    let connectionControllerData: {socketClientObs: SocketObs, messageObservable: Observable<any>};
    setTimeout(() => {
        connectionControllerData = connectControllerToServer();
        controller_Test10(connectionControllerData);
    }, 100);
    // TEST 10 - build phase 3
    // filter the dynamics info for the Controller created in "TEST 10 - build phase 3"
    setTimeout(() => {
        monitorSharedMessageObs.pipe(
            filter(dynamicsAndMobObjId => dynamicsAndMobObjId.mobObjId === mobObjId_Test10), // take the MobileObject created for this test
            map(dynamicsAndMobObjId => dynamicsAndMobObjId.dynamics),
            map(dynamics => JSON.parse(dynamics)),
            map(dynamics => dynamics[0]) // take the X axis
        )
        .subscribe(
            dynamics => mobObj_Dynamics = dynamics,
        );
    }, 200);
    let firstCheckPassed = true;
    let secondCheckPassed = true;
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 10 step 1 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel <= 0) {
            firstCheckPassed = false;
            console.error('TEST 10 - the mobile object should have positive velocity', mobObj_Dynamics);
        }
    }, 1151);
    setTimeout(() => {
        if (!mobObj_Dynamics) {
            console.error('TEST 10 step 2 - the dynamics mobile object should be defined');
        }
        if (mobObj_Dynamics.vel !== 0) {
            secondCheckPassed = false;
            console.error('TEST 10 - the mobile object should be still after some time');
        }
        if (firstCheckPassed && secondCheckPassed) {
            console.log('TEST 10 passed')
        }
        connectionControllerData.socketClientObs.close();
        connectionMonitorData.socketClientObs.close();
    }, 1199);
}
monitorConnectsAndThenControllerTest();


// TEST 11
// One Controller connects to the Server and creates a MobileObject - also a Monitor connects
// After some time the Controller disconnects and the Monitor gets notified that a MobileObject has been removed
// Later a Monitor connects to the Server
let mobObjId_Test11;
const controller_Test11 = (connectionData: {socketClientObs: SocketObs, messageObservable: Observable<any>}) => {
    setTimeout(() => {
        const turnOnCommand: MobileObjectCommandMessage = {action: MobileObjectCommand.TURN_ON};
        connectionData.socketClientObs.send(MessageType.CONTROLLER_COMMAND, turnOnCommand);
    }, 1100);
    // the Controller disconnects
    setTimeout(() => {
        connectionData.socketClientObs.close();
    }, 2000);
    connectionData.messageObservable.pipe(
        tap(id => mobObjId_Test11 = id)
    )
    .subscribe();
}
const controllerDisconnectsAndMonitorIsNotifiedTest = () => {
    let mobObjRemovedId;
    const connectionControllerData = connectControllerToServer();
    const connectionMonitorData = connectMonitorToServer();
    connectionMonitorData.messageObservable
    .pipe(
        filter(id => id === mobObjId_Test11), // take the MobileObject created for this test
        switchMap(_mobObjId => connectionMonitorData.socketClientObs.onMessageType(MessageType.MOBILE_OBJECT_REMOVED + mobObjId_Test11)),
    )
    .subscribe(
        mobObjId => mobObjRemovedId = mobObjId,
    );
    controller_Test11(connectionControllerData);
    setTimeout(() => {
        if (!mobObjRemovedId) {
            console.error('TEST 11 - the mobile object should have been removed');
        } else
        if (mobObjRemovedId !== mobObjId_Test11) {
            console.error('TEST 11 - the mobile object removed is not that expected', mobObjRemovedId, mobObjId_Test11);
        } else {
            console.log('TEST 11 passed')
        }
        // socketController.close();
        connectionMonitorData.socketClientObs.close();
    }, 2150);
}
controllerDisconnectsAndMonitorIsNotifiedTest();





// TEST 12
// One Controller connects to the Server and creates a MobileObject and then connects again over the same socket
// sending a second BIND_CONTROLLER message - just one mobile object is created and not 2
const controllerConnectsTwiceOverTheSameSocketTest = () => {
    const connectionData = connectControllerToServer();
    let mobObjId_counter = 0;
    connectionData.messageObservable.pipe(
        tap(() => console.log('TEST 12 - Controller send BIND CONTROLLER messages')),
        delay(200),
        tap(() => connectionData.socketClientObs.send(MessageType.BIND_CONTROLLER)),
    )
    .subscribe(() => mobObjId_counter++);
    setTimeout(() => {
        if (mobObjId_counter !== 1) {
            console.error('TEST 12 - we should have received just 1 mobileObjectId');
        } else {
            console.log('TEST 12 passed')
        }
        connectionData.socketClientObs.close();
    }, 2250);
}
controllerConnectsTwiceOverTheSameSocketTest()


// TEST 13
// One Controller connects to the Server as Controller sending a BIND_CONTROLLER message
// and then connects again as Monitor over the same socket sending a second BIND_MONITOR message
// Just one message is received as response from the Server - the second request to bind just get lost
const connnectFirstAsControllerAndThenAsServerOverTheSameSocketTest = () => {
    const connectionData = connectControllerToServer();
    let messagesReceived_counter = 0;
    connectionData.messageObservable.pipe(
        tap(() => console.log('TEST 13 - send BIND CONTROLLER message and then BIND_MONITOR message')),
        delay(200),
        tap(() => connectionData.socketClientObs.send(MessageType.BIND_MONITOR)),
    )
    .subscribe(() => messagesReceived_counter++);
    setTimeout(() => {
        if (messagesReceived_counter !== 1) {
            console.error('TEST 13 - we should have received just 1 message');
        } else {
            console.log('TEST 13 passed')
        }
        connectionData.socketClientObs.close();
    }, 2300);
}
connnectFirstAsControllerAndThenAsServerOverTheSameSocketTest();
