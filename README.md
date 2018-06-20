# Mobile Object Server, Controller and Monitor

## This is the code that implements what has been described in this article
https://medium.com/@enrico.piccinin/reactive-thinking-how-to-design-a-distributed-system-with-rxjs-websockets-and-node-57d772f89260


## Server
The **MobileObjectServer** implementation can be found in the _**server**_ directory

### MobileObject
The MobileObject implementation is part of the Server implementation and can be found in the _**server/src/mobile-object**_ directory

The logic implemented by the **MobileObject** is described here https://medium.freecodecamp.org/thinking-reactively-how-to-animate-with-movement-objects-using-rxjs-692518b6f2ac

## Monitor and Controller
**Monitor** and **Controller** are Angular web applications whose code can be found in the directories _**monitor-app**_ and _**controller-app**_


## Installation
* Clone the repository
* Execute `npm install` from within _**server**_, _**monitor-app**_ and _**controller-app**_ directories
* From within _**server**_ directory launch the command `node ./dist/index`
* From within _**monitor-app**_ directory launch the command `ng serve --port 4010`  (feel free to choose any port, this command just launches the development server of Angular)
* From within _**controller-app**_ directory launch the command `ng serve --port 4011`  (feel free to choose any port, this command just launches the development server of Angular)
* Open a browser window and request the url `localhost:4010` - this opens a Monitor
* Open a second browser window and request the url `localhost:4011` - this opens a Controller
* As soon as you open the Controller you should see on the Monitor a small car which represents the MobileObject created by opening a Controller
* Turn on the MobileObject clicking the green button on the Controller
* Now you can move the MobileObject clicking on the different arrows present in the Controller


