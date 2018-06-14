var markers = [];
var circles = [];

function initDataForMap() {
  markers.forEach(function(marker) {
    marker.setMap(null);
  });
  markers.length = 0;

  circles.forEach(function(circle) {
    circle.setMap(null);
  });
  circles.length = 0;

  //KML TEST
  // var paddockKML = new google.maps.KmlLayer({
  //       url: 'http://ioa.co.nz/img/paddocks.kml',
  //       map: map
  // });

  //Get device data from Cloudant, convert to geoJson
  const devicesUrl =
    "https://0d664ca0-3c79-4620-a429-b55e8512d0c5-bluemix.cloudant.com/devices/_all_docs?include_docs=true";

  const optionsDevice = {
    method: "GET",
    crossDomain: true,
    headers: {
      Authorization:
        "Basic c29uZXNwZWN0aWVzdHJpdmFpbnN0cmFpOmM1ZGZjMWY1MDBhYWQ1OTg3M2RkYjY3YTE0NTIwZmNiYjI0YzAyY2Y="
    }
  };

  let devices = undefined;

  //DEVICES!!
  const deviceGeoJsonPromise = new Promise(resolve => {
    fetch(devicesUrl, optionsDevice)
      .then(res => res.json())
      .then(data => {
        resolve(data.rows.map(row => row.doc));
      })
      .catch(err => console.log("Error: ", err));
  });

  //=================*** DATA!! ***=============================

  const dataUrl =
    // 'https://0d664ca0-3c79-4620-a429-b55e8512d0c5-bluemix.cloudant.com/device_data/_all_docs?include_docs=true&descending=true&limit=1000'
    "https://0d664ca0-3c79-4620-a429-b55e8512d0c5-bluemix.cloudant.com/device_data/_find";

  const optionsData = {
    method: "POST",
    crossDomain: true,
    headers: {
      Authorization:
        "Basic d2FyZGVydWNjZXBvb2RpdHNpcmVsdGFiOjI1MDBmYTYyYzM2NDI2ZDA5ZTY4ZjFkNjkwMWM1YmI0MzNjMTc2NTQ=",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      selector: {
        created: {
          $gte: 0
        }
      },
      fields: [
        "_id",
        "device_physical_id",
        "device_name",
        "temperature",
        "humidity",
        "amps",
        "kilovolts",
        "flow",
        "status",
        "gps",
        "created"
      ],
      sort: [
        {
          created: "desc"
        }
      ],
      limit: 100
    })
  };

  const deviceDataPromise = new Promise(resolve => {
    fetch(dataUrl, optionsData)
      .then(res => res.json())
      .then(data => {
        resolve(data);
      })
      .catch(err => console.log("Error: ", err));
  });

  deviceGeoJsonPromise
    .then(data => {
      devices = data;
      return deviceDataPromise;
    })
    .then(deviceData => {
      console.log("got devices?");
      console.log(devices);
      console.log("got data?");
      console.log(deviceData);

      /*===========***   got 100 last data packets in 'deviceData'.  ***
        Not used for markers. Currently getting data on marker click??!!  ***=================*/

      //take data from 100 most recent records on the database
      //and put them into an object of live devices and their temp/hum readings
      const liveDevices = deviceData.docs.reduce((recentDevices, device) => {
        recentDevices[device.device_name] =
          recentDevices[device.device_name] || [];
        recentDevices[device.device_name].push({
          created: device.created,
          temp: device.temperature,
          hum: device.humidity,
          amps: device.amps,
          kilovolts: device.kilovolts,
          flow: device.flow,
          gate: device.status,
          //TODO: flow: device.flow (when adding new devices) will also need to be brought through the Fetch (optionsData))
          location: device.gps
        });
        return recentDevices;
      }, {});
      console.log("whats live?");
      console.log(liveDevices);

      //get the average
      //get the median
      //of recent devices
      const computedTempHum = computeRecentDevices(liveDevices);
      console.log(computedTempHum);
      //insert computed averages and median into dashboard
      document.querySelector("#medianTempValue").innerHTML =
        computedTempHum.medianTemp + " <sup>&deg;C</sup>";
      document.querySelector("#averageTempValue").innerHTML =
        computedTempHum.averageTemp + " <sup>&deg;C</sup>";
      document.querySelector("#medianHumValue").innerHTML =
        computedTempHum.medianHum + " <sup>%</sup>";
      document.querySelector("#averageHumValue").innerHTML =
        computedTempHum.averageHum + " <sup>%</sup>";

      //CREATE MARKERS - Using liveDevices - (ie. only live devices, in the most recent 100 data packets)
      /*
        console.log('loop markers')
        for (const device in liveDevices) {
            // console.log(liveDevices[device][0].location)
            createMarkerForDevice(liveDevices[device][0].location, device, liveDevices[device][0].temp, liveDevices[device][0].hum)
        }
        */

      //Add events to ICONS
      document.getElementById("tempIcon").addEventListener("click", () => {
        console.log("icon clicked");
        createMarkers("THS");
      });
      document.getElementById("waterIcon").addEventListener("click", () => {
        console.log("icon clicked");
        createMarkers("WF");
      });
      document.getElementById("fenceIcon").addEventListener("click", () => {
        console.log("icon clicked");
        createMarkers("EF");
      });

      function createMarkers(iconType) {
        //TODO: New object of only these devices (iconType)

        markers.forEach(function(marker) {
          marker.setMap(null);
        });
        markers.length = 0;

        circles.forEach(function(circle) {
          circle.setMap(null);
        });
        circles.length = 0;

        //CREATE MARKERS - Using geoJson - (ie. All devices in DB)
        //loop each device
        for (var i = 0; i < devices.length; i++) {
          //get device latlng coordinates for marker
          var coords = devices[i].location;
          var latLng = new google.maps.LatLng(coords[0], coords[1]);
          var deviceName = devices[i].name;
          var deviceType = devices[i].type;
          //return the last device reading. (will only find if is in the last 100 queried)
          var thisDevice = isDeviceLive(deviceName, deviceData.docs);

          if (iconType == deviceType) {
            //CREATE MARKERS!!!!!!
            createMarkerForDevice(
              latLng,
              deviceName,
              thisDevice.markerColour,
              thisDevice.lastTemp,
              thisDevice.lastHum,
              deviceType
            );
            //jacking this loop to test google HSL circles
            createCircle(thisDevice, latLng);
          }
        }
        //end of for loop (that creates the markers)
      }
    }); //end Promise

  //ADD NEW MARKER ON CLICK
  // google.maps.event.addListener(map, 'click', function (event) {
  //     placeMarker(event.latLng);
  // });

  // function placeMarker(location) {
  //     var marker = new google.maps.Marker({
  //         position: location,
  //         map: map
  //     });
  // }
} //-------- End initMap()
