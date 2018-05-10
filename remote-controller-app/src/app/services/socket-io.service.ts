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

  public send(message) {
      this.socket.emit('message', message);
  }

  public onMessage(): Observable<any> {
      return new Observable<any>(observer => {
          this.socket.on('message', (data) => observer.next(data));
      });
  }

  public onEvent(event: Event): Observable<Event> {
      return new Observable<Event>(observer => {
          this.socket.on(event, () => observer.next());
      });
  }

}
