"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const express = require("express");
const sockets_1 = require("./sockets");
const server_multi_object_1 = require("./server-multi-object");
console.log('start socket server');
const expressServer = express();
const port = process.env.PORT || 8081;
const httpServer = http_1.createServer(expressServer);
const socketsObervable = sockets_1.sockets(httpServer, port);
const mobileObjectServer = new server_multi_object_1.MobileObjectServer();
mobileObjectServer.start(socketsObervable);
//# sourceMappingURL=index.js.map