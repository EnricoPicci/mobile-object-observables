import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import * as socketIo from 'socket.io-client';

import {environment} from '../../environments/environment';
import {SocketService, Event} from './socket-service';

const SERVER_URL = environment.socketServerUrl;

@Injectable()
export class SocketIoService extends SocketService {

  constructor() {
      super();
  }

  private socket: SocketIOClient.Socket;

  public initSocket() {
      this.socket = socketIo(SERVER_URL);
  }

  public send(event: Event, message) {
      this.socket.emit(event, message);
  }

  public onEvent(event: Event): Observable<Event> {
      return new Observable<Event>(observer => {
          this.socket.on(event, data => observer.next(data));
      });
  }

}
