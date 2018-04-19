import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';

import { DeviceService } from './services/device.service';

import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';


@NgModule({
    declarations: [
        AppComponent,
        MapComponent
    ],
    imports: [
        BrowserModule,
        HttpModule
    ],
    providers: [DeviceService],
    bootstrap: [AppComponent]
})
export class AppModule { }
