import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgNippleComponent } from './ng-nipple.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [NgNippleComponent],
  exports: [NgNippleComponent]
})
export class NgNippleModule { }
