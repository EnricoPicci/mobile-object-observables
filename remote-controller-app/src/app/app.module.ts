import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { ControllerPadComponent } from './controller-pad/controller-pad.component';
import {SocketService} from './services/socket-service';
import {SocketIoService} from './services/socket-io.service';
import {SocketObsService} from './services/socket-obs.service';


@NgModule({
  declarations: [
    AppComponent,
    ControllerPadComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{ provide: SocketService, useClass: SocketIoService }],
  bootstrap: [AppComponent]
})
export class AppModule { }
