

import { createServer, Server } from 'http';
import * as express from 'express';

import {sockets} from './sockets';
import { MobileObjectServer } from './server-multi-object';

console.log('start socket server');

const expressServer = express();
const port = process.env.PORT || 8081;

const httpServer: Server = createServer(expressServer);

const socketsObervable = sockets(httpServer, port);

const mobileObjectServer = new MobileObjectServer();
mobileObjectServer.start(socketsObervable)

