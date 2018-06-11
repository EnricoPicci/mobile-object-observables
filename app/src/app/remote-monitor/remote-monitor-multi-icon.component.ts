import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-remote-monitor-multi-icon',
  template: `
    <div style="text-align:center" style="position: absolute;"
        [style.top]="position.top + 'px'" [style.left]="position.left + 'px'" #mobileobject>
      <img width="50" src="../../assets/car.jpg" [style.transform]="'rotate(' + (imagerotation ? imagerotation : 0) + 'deg)'">
    </div>
  `
})
export class RemoteMonitorMultiIconComponent {
    @Input() position = {left: 10, top: 0};
    @Input() imagerotation: number;
}

