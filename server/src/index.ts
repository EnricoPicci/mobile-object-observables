
// import { MobileObjectServer } from './server';
import { MobileObjectServer } from './server-multi-object';
// import { MobileObjectServer } from './server-multi-object-1';
// import { MobileObjectServer } from './server-stress';

let app = new MobileObjectServer().getApp();
export { app };
