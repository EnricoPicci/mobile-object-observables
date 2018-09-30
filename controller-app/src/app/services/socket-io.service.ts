import { Injectable } from '@angular/core';
import { Observable ,  Observer } from 'rxjs';

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

  public onEvent(event): Observable<string> {
      return new Observable<string>((observer: Observer<string>) => {
          this.socket.on(event, (data: string) => observer.next(data));
      });
  }

  public close() {
      this.socket.close();
  }

}
