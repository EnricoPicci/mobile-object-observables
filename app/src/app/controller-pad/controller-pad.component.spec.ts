import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ControllerPadComponent } from './controller-pad.component';

describe('ControllerPadComponent', () => {
  let component: ControllerPadComponent;
  let fixture: ComponentFixture<ControllerPadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ControllerPadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ControllerPadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
