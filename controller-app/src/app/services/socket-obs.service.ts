import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { WebSocketSubject } from 'rxjs/webSocket';

import {environment} from '../../environments/environment';
import {SocketService, Event} from './socket-service';

const SERVER_URL = environment.socketServerUrl;

@Injectable()
export class SocketObsService extends SocketService {
  socket$: WebSocketSubject<any>;

  constructor() {
    super();
  }

  initSocket() {
    this.socket$ = webSocket(SERVER_URL);
  }
  send(event: Event, message) {
    // this.socket$.next(event, message);
  }
  onEvent(event: Event): Observable<Event> {
    return this.socket$.asObservable();
  }
  close() {
    this.socket$.complete();
  }

}
