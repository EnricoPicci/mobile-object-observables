import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

// import nipplejs from 'nipplejs';
import * as nipplejs from 'nipplejs';
import { Observer } from 'rxjs/Observer';

@Component({
  selector: 'ng-nipple',
  // templateUrl: './ng-nipple.component.html',
  template: `
  <div id="zone_joystick">
    <div class="zone static"></div>
  </div>
  `,
  styleUrls: ['./ng-nipple.component.css']
})
export class NgNippleComponent implements OnInit {
  @Input() position: {left: string, top: string};
  joystick;
  end: Observable<any>;
  up: Observable<any>;
  down: Observable<any>;
  left: Observable<any>;
  right: Observable<any>;

  constructor() { }

  ngOnInit() {
    console.log('init dynamic 1', document.querySelector('.zone.static'));
    const configNipple = {
      zone: document.querySelector('.zone.static'),
      mode: 'static',
      // position: {
      //   left: '16%',
      //   top: '50%'
      // },
      position: this.position,
      color: 'red'
    };
    this.joystick = nipplejs.create(configNipple);
    // this.joystick.on(
    //   'start end dir:up dir:left dir:down dir:right',
    //   function(evt, data) {
    //     console.log('movement', evt, data);
    //   }
    // );
    this.end = Observable.create(this.subscriberFunction('end'));
    this.up = Observable.create(this.subscriberFunction('dir:up'));
    this.down = Observable.create(this.subscriberFunction('dir:down'));
    this.left = Observable.create(this.subscriberFunction('dir:left'));
    this.right = Observable.create(this.subscriberFunction('dir:right'));

  }

  private subscriberFunction(event: string) {
    return (observer: Observer<any>) => {
      this.joystick.on(
        event,
        (evt, data) => observer.next({evt, data})
      );
    };
  }

}
