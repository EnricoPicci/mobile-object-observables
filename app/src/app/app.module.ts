import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { RemoteMonitorComponent } from './remote-monitor/remote-monitor.component';
import {RemoteMonitorMultiComponent} from './remote-monitor/remote-monitor-multi.component';
import {RemoteMonitorMultiIconComponent} from './remote-monitor/remote-monitor-multi-icon.component';
import {SocketService} from './services/socket-service';
import {SocketIoService} from './services/socket-io.service';
import {SocketObsService} from './services/socket-obs.service';
import {DomService} from './services/dom.service';


@NgModule({
  declarations: [
    AppComponent,
    RemoteMonitorComponent,
    RemoteMonitorMultiComponent,
    RemoteMonitorMultiIconComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{ provide: SocketService, useClass: SocketIoService }, DomService],
  bootstrap: [AppComponent],
  entryComponents: [RemoteMonitorMultiIconComponent]
})
export class AppModule { }
