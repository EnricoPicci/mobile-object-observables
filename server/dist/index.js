"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import { MobileObjectServer } from './server';
const server_multi_object_1 = require("./server-multi-object");
// import { MobileObjectServer } from './server-multi-object-1';
// import { MobileObjectServer } from './server-stress';
let app = new server_multi_object_1.MobileObjectServer().getApp();
exports.app = app;
//# sourceMappingURL=index.js.map