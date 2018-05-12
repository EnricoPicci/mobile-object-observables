import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { MobileObjectViewComponent } from './mobile-object-view/mobile-object-view.component';
import { RemoteMonitorComponent } from './remote-monitor/remote-monitor.component';
import {SocketService} from './services/socket-service';
import {SocketIoService} from './services/socket-io.service';
import {SocketObsService} from './services/socket-obs.service';


@NgModule({
  declarations: [
    AppComponent,
    MobileObjectViewComponent,
    RemoteMonitorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{ provide: SocketService, useClass: SocketIoService }],
  bootstrap: [AppComponent]
})
export class AppModule { }
