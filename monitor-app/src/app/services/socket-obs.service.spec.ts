import { TestBed, inject } from '@angular/core/testing';

import { SocketObsService } from './socket-obs.service';

describe('SocketObsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SocketObsService]
    });
  });

  it('should be created', inject([SocketObsService], (service: SocketObsService) => {
    expect(service).toBeTruthy();
  }));
});
