import { Injectable } from '@angular/core';
import { Http, RequestOptionsArgs, Headers, RequestMethod } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

const devicesUrl = 'https://0d664ca0-3c79-4620-a429-b55e8512d0c5-bluemix.cloudant.com/devices/_all_docs?include_docs=true';

const requestOptions: RequestOptionsArgs = {
    method: RequestMethod.Get,
    headers: new Headers({
        'Authorization': 'Basic c29uZXNwZWN0aWVzdHJpdmFpbnN0cmFpOmM1ZGZjMWY1MDBhYWQ1OTg3M2RkYjY3YTE0NTIwZmNiYjI0YzAyY2Y='
    })
};

@Injectable()
export class DeviceService {

    private _devices: Subject<any> = new Subject<any>();
    public devices$: Observable<any> = this._devices.asObservable();

    constructor(private http: Http) { }

    public refreshDevices() {
        this.http.get(devicesUrl, requestOptions).subscribe(
            (response) => {
                this._devices.next(response.json());
            },
            (error) => {
                // TODO
            }
        );
    }

}
