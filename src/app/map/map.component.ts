import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { DeviceService } from '../services/device.service';
import { Subject } from 'rxjs/Subject';

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

    @ViewChild('gmap') private gmapElement: ElementRef;
    private map: google.maps.Map;

    private _devicesGeoJson: Subject<any> = new Subject<any>();

    private markers: google.maps.Marker[] = [];

    private currentInfoWindow?: google.maps.InfoWindow;

    constructor(private deviceService: DeviceService) { }

    // source: https://stackoverflow.com/questions/40289624/change-google-map-marker-color-to-a-color-of-my-choice
    private static pinSymbol(color) {
        return {
            path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#000',
            strokeWeight: 1,
            scale: 1
        };
    }

    ngOnInit() {
        const mapProp = {
            zoom: 15.5,
            center: new google.maps.LatLng(-40.081, 175.475),
            mapTypeId: google.maps.MapTypeId.SATELLITE,
            disableDefaultUI: true
        };
        this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);

        this.deviceService.devices$.subscribe((devices) => {
            console.log(devices);

            const geojson = {};
            geojson['type'] = 'FeatureCollection';
            geojson['features'] = [];
            devices.rows.forEach(device => {
                const newFeature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [parseFloat(device.doc.location[1]),
                            parseFloat(device.doc.location[0])
                        ]
                    },
                    'properties': {
                        'title': device.doc.name,
                        'description': device.doc.description
                    }
                };
                geojson['features'].push(newFeature);
            });

            this._devicesGeoJson.next(geojson);
        });


        this._devicesGeoJson.asObservable().subscribe((geojson) => {
            geojson.features.forEach(feature => {
                // get device latlng coordinates for marker
                const coords = feature.geometry.coordinates;
                const latLng = new google.maps.LatLng(coords[1], coords[0]);
                const deviceName = feature.properties.title;
                // return the last device reading. (will only find if is in the last 100 queried)
                // var thisDevice = isDeviceLive(deviceName, deviceData.docs);
                // function that creates each marker
                this.createMarkerForDevice(feature, latLng, deviceName);
            });
        });

        this.deviceService.refreshDevices();
    }

    private createMarkerForDevice(feature: any, latLng: any, name: any) {
        // sort that latlng
        // this is only used to create markers with liveDevices (not the geojson way)
        // const latLng = new google.maps.LatLng(gps[0], gps[1]);

        // ===== CREATE MARKER with infowindow
        const marker = new google.maps.Marker({
            position: latLng,
            map: this.map,
            // icon: 'http://www.ioa.co.nz/img/'+ colour +'.png',
            icon: MapComponent.pinSymbol('#fafafa'),
            label: {
                text: 'test1', // lastTemp, // label on marker
                color: '#fafafa' // colour,
            }
        });

        this.markers.push(marker);

        const mapComponent = this;

        // add infoWindow Event
        marker.addListener('click', function(this: google.maps.Marker) {
            mapComponent.showInfoWindowForDevice(this, feature);
        });

    }

    private showInfoWindowForDevice(marker: google.maps.Marker, feature: any) {
        if (this.currentInfoWindow != null) {
            this.currentInfoWindow.close();
            this.currentInfoWindow = undefined;
        }

        const content = `
            <div class="deviceDataWindow">
                    <div class="deviceDataLabel" id="tempLabel">Temperature</div>
                    <div class="deviceDataReading" id="tempValue"><sup>&deg;C</sup></div>

                    <div class="deviceDataLabel" id="humLabel">Humidity</div>
                    <div class="deviceDataReading" id="humValue"><sup>%</sup></div>

                    <div class="deviceDataLabel" id="deviceLabel">Device Name</div>
                    <div class="deviceDataValue" id="deviceValue"></div>

                    <div class="deviceDataLabel" id="timeLabel">Last Activity</div>
                    <div class="deviceDataValue" id="timeValue"></div>

                    <div class="deviceDataLabel" id="tempHistoryLabel">Temp History</div>
                    <div class="graph deviceDataLabel" id="tempGraph"></div>

                    <div class="deviceDataLabel" id="humHistoryLabel">Hum History</div>
                    <div class="graph deviceDataLabel" id="humGraph"></div>
            </div>
        `;

        // create infowindow
        const infoWindow = new google.maps.InfoWindow({
            content: content
        });

        infoWindow.open(this.map, marker);

        // add marker click event (zoom, and pan)
        this.map.setZoom(17);
        this.map.setCenter(marker.getPosition());
        // offset marker to make room for tall infowindow
        this.map.panBy(0, -200);

        this.currentInfoWindow = infoWindow;
    }
}
