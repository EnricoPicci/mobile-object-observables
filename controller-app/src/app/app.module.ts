import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import {NgNippleModule} from './ng-nipple/ng-nipple.module';
// import {NgNippleComponent} from './ng-nipple/ng-nipple.component';

import { AppComponent } from './app.component';
import { ControllerPadComponent } from './controller-pad/controller-pad.component';
import {SocketService} from './services/socket-service';
import {SocketIoService} from './services/socket-io.service';


@NgModule({
  declarations: [
    AppComponent,
    ControllerPadComponent,
    // NgNippleComponent
  ],
  imports: [
    BrowserModule,
    NgNippleModule
  ],
  providers: [{ provide: SocketService, useClass: SocketIoService }],
  bootstrap: [AppComponent]
})
export class AppModule { }
