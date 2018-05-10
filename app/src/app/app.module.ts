import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { MobileObjectViewComponent } from './mobile-object-view/mobile-object-view.component';


@NgModule({
  declarations: [
    AppComponent,
    MobileObjectViewComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
