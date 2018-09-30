import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {NgJoystickModule} from 'ng-joystick';

import { AppComponent } from './app.component';
import { ControllerPadComponent } from './controller-pad/controller-pad.component';
import {SocketService} from './services/socket-service';
import {SocketIoService} from './services/socket-io.service';


@NgModule({
  declarations: [
    AppComponent,
    ControllerPadComponent,
  ],
  imports: [
    BrowserModule,
    NgJoystickModule
  ],
  providers: [{ provide: SocketService, useClass: SocketIoService }],
  bootstrap: [AppComponent]
})
export class AppModule { }
