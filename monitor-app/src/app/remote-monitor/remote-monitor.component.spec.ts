import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteMonitorComponent } from './remote-monitor.component';

describe('RemoteMonitorComponent', () => {
  let component: RemoteMonitorComponent;
  let fixture: ComponentFixture<RemoteMonitorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RemoteMonitorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
