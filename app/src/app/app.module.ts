import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { RemoteMonitorComponent } from './remote-monitor/remote-monitor.component';
import {SocketService} from './services/socket-service';
import {SocketIoService} from './services/socket-io.service';
import {SocketObsService} from './services/socket-obs.service';


@NgModule({
  declarations: [
    AppComponent,
    RemoteMonitorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{ provide: SocketService, useClass: SocketIoService }],
  bootstrap: [AppComponent]
})
export class AppModule { }
