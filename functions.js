///////////////////HSL CIRCLE TEST
function createCircle(thisDevice, latLng) {
  var temp = Number(thisDevice.lastTemp);

  var low = [151, 83, 34]; // color of mag 1.0
  var high = [5, 69, 54]; // color of mag 6.0 and above
  var minMag = 10.0;
  var maxMag = 30.0;

  // fraction represents where the value sits between the min and max
  var fraction = (Math.min(temp, maxMag) - minMag) / (maxMag - minMag);

  var color = interpolateHsl(low, high, fraction);

  // return {
  //     icon: {
  //         path: google.maps.SymbolPath.CIRCLE,
  //         strokeWeight: 0.5,
  //         strokeColor: '#fff',
  //         fillColor: color,
  //         fillOpacity: 2 / thisDevice.lastTemp,
  //         // while an exponent would technically be correct, quadratic looks nicer
  //         scale: Math.pow(thisDevice.lastTemp, 2)
  //     },
  //     zIndex: Math.floor(thisDevice.lastTemp)
  // };

  var circle = new google.maps.Circle({
    strokeWeight: 0.5,
    strokeColor: "#fff",
    fillColor: color,
    fillOpacity: 0.6,
    map: map,
    center: latLng,
    radius: temp
  });

  circles.push(circle);
}

function interpolateHsl(lowHsl, highHsl, fraction) {
  var color = [];
  for (var i = 0; i < 3; i++) {
    // Calculate color based on the fraction.
    color[i] = (highHsl[i] - lowHsl[i]) * fraction + lowHsl[i];
  }

  return "hsl(" + color[0] + "," + color[1] + "%," + color[2] + "%)";
}

function computeRecentDevices(recentDevices) {
  recentTemps = [];
  recentHums = [];

  //loop data for latest device readings
  for (const eachDevice in recentDevices) {
    if (recentDevices[eachDevice][0].temp) {
      recentTemps.push(Number(recentDevices[eachDevice][0].temp));
    }
    if (recentDevices[eachDevice][0].hum) {
      recentHums.push(Number(recentDevices[eachDevice][0].hum));
    }
  }

  //average for most recent Temperature readings
  let sum = recentTemps.reduce((previous, current) => (current += previous));
  let avgTemps = sum / recentTemps.length;
  console.log("average temperature is: ", avgTemps);

  //average for most recent Humidity readings
  sum = recentHums.reduce((previous, current) => (current += previous));
  let avgHums = sum / recentHums.length;
  console.log("average hum:");
  console.log(avgHums);

  //median for most recent Temperature readings
  recentTemps.sort((a, b) => a - b);
  let lowMiddle = Math.floor((recentTemps.length - 1) / 2);
  let highMiddle = Math.ceil((recentTemps.length - 1) / 2);
  let medianTemps = (recentTemps[lowMiddle] + recentTemps[highMiddle]) / 2;

  //median for most recent Temperature readings
  recentHums.sort((a, b) => a - b);
  lowMiddle = Math.floor((recentHums.length - 1) / 2);
  highMiddle = Math.ceil((recentHums.length - 1) / 2);
  let medianHums = (recentHums[lowMiddle] + recentHums[highMiddle]) / 2;

  //return object to computedTempHum = {}
  return {
    averageTemp: avgTemps.toFixed(1),
    medianTemp: medianTemps,
    averageHum: avgHums.toFixed(1),
    medianHum: medianHums
  };
}

function isDeviceLive(nameKey, myArray) {
  //loop all docs. see if nameKey is in docs. if it is make green. if not make grey.
  for (var i = 0; i < myArray.length; i++) {
    if (myArray[i].device_name === nameKey) {
      // return this if device WAS present
      return {
        markerColour: "#7CFC00",
        lastTemp: Number(myArray[i].temperature).toFixed(1),
        lastHum: Number(myArray[i].humidity).toFixed(1)
      };
    }
  }
  return {
    markerColour: "grey",
    lastTemp: "offline",
    lastHum: "offline"
  };
}

function createMarkerForDevice(latLng, name, colour, lastTemp, lastHum, type) {
  let content = `
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

  //create infowindow
  var infowindowData = new google.maps.InfoWindow({
    content: content
  });

  //sort that latlng
  //this is only used to create markers with liveDevices (not the geojson way)
  // const latLng = new google.maps.LatLng(gps[0], gps[1]);

  //===== CREATE MARKER with infowindow
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    // icon: 'http://www.ioa.co.nz/img/'+ colour +'.png',
    icon: pinSymbol(colour),
    label: {
      text: lastTemp, //label on marker
      color: colour
    },
    infowindow: infowindowData
  });

  markers.push(marker);

  //add infoWindow Event
  marker.addListener("click", function() {
    //close any open info windows
    closeAllInfoWindows(map);
    //open new infowindow
    this.infowindow.open(map, marker);

    //add marker click event (zoom, and pan)
    map.setZoom(17);
    map.setCenter(marker.getPosition());
    //offset marker to make room for tall infowindow
    map.panBy(0, -200);

    //update device data

    populateGraph(name);
  });
} //end createMarkerForDevice()

//source: https://stackoverflow.com/questions/40289624/change-google-map-marker-color-to-a-color-of-my-choice
function pinSymbol(color) {
  return {
    path:
      "M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#000",
    strokeWeight: 1,
    scale: 1
  };
}

// Hide all markers function
function closeAllInfoWindows(map) {
  markers.forEach(function(marker) {
    marker.infowindow.close(map, marker);
  });
}

/*
============= Populate Graph =============
*/
function populateGraph(deviceName) {
  const dataUrl =
    "https://0d664ca0-3c79-4620-a429-b55e8512d0c5-bluemix.cloudant.com/device_data/_find";

  const optionsSingleDevice = {
    method: "POST",
    crossDomain: true,
    headers: {
      Authorization:
        "Basic d2FyZGVydWNjZXBvb2RpdHNpcmVsdGFiOjI1MDBmYTYyYzM2NDI2ZDA5ZTY4ZjFkNjkwMWM1YmI0MzNjMTc2NTQ=",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      selector: {
        device_name: {
          $eq: deviceName
        }
      },
      fields: ["_id", "device_name", "temperature", "humidity", "created"],
      sort: [
        {
          created: "desc" //get the most recent records for this device
        }
      ],
      limit: 10 //limit this to the 10 most recent records
    })
  };

  //get single device data
  const singleDeviceDataPromise = new Promise(resolve => {
    fetch(dataUrl, optionsSingleDevice)
      .then(res => res.json())
      .then(dataSingle => {
        // resolve(data)
        console.log("single device data");
        console.log(dataSingle);

        //create temp and hum objects for chart data
        //Temperature
        let temp = {
          x: [],
          y: [],
          text: [],
          textposition: "top center",
          textfont: {
            size: 9
          },
          mode: "lines+text",
          type: "scatter",
          name: "temp",
          line: {
            color: "rgb(253, 180, 75)"
          },
          hoverinfo: "x+y"
          // marker: { size: 12 }
        };

        //Humidity
        let hum = {
          x: [],
          y: [],
          text: [],
          textposition: "top center",
          textfont: {
            size: 9
          },
          mode: "lines+text",
          // textposition: 'top center',
          type: "scatter",
          name: "hum",
          line: {
            color: "rgb(0, 187, 240)"
          },
          hoverinfo: "x+y"
        };

        //loop data to plot onto graph
        for (const each in dataSingle.docs) {
          //convert UTC packet created time to NZ time
          let time = new Date(dataSingle.docs[each].created);
          temp.x.push(time);
          temp.y.push(dataSingle.docs[each].temperature);
          temp.text.push(dataSingle.docs[each].temperature);
          hum.x.push(time);
          hum.y.push(dataSingle.docs[each].humidity);
          hum.text.push(dataSingle.docs[each].humidity);
        }

        // console.log(temp)

        //reverse arrays so the last 10 records are in ascending order.
        temp.x.reverse();
        temp.y.reverse();
        temp.text.reverse();
        hum.x.reverse();
        hum.y.reverse();
        hum.text.reverse();

        //chart data
        const tempChartData = [temp];
        const humChartData = [hum];

        //chart layout
        let layout = {
          // title: 'Temperature & Humidity',
          autosize: true,
          showlegend: false,
          legend: {
            // "orientation": "h",
            x: 0,
            y: 100
          },
          margin: {
            t: 10,
            b: 60,
            l: 10,
            r: 10,
            pad: 0
          },
          xaxis: {
            // title: 'AXIS TITLE',
            // titlefont{},
            tickangle: 45,
            tickfont: {
              family: "Arial, sans-serif",
              size: 9,
              color: "black"
            },
            showgrid: false
          },
          yaxis: {
            // title: 'AXIS TITLE',
            tickangle: 0,
            tickfont: {
              family: "Arial, sans-serif",
              size: 9,
              color: "black"
            },
            showgrid: false,
            showticklabels: false
          }
        };

        //update infowindow values for single device

        //DEVICE NAME
        document.getElementById("deviceValue").innerHTML =
          dataSingle.docs[0].device_name;
        //LAST ACTIVITY
        let time = new Date(dataSingle.docs[0].created).toString();
        document.getElementById("timeValue").innerHTML = time;
        //TEMPERATURE
        let roundedTemp = Math.round(dataSingle.docs[0].temperature * 10) / 10;
        document.getElementById("tempValue").innerHTML =
          roundedTemp.toFixed(1) + "<sup>&deg;C</sup>";
        //HUMIDITY
        document.getElementById("humValue").innerHTML =
          dataSingle.docs[0].humidity + "<sup>%</sup>";

        //load graphs
        Plotly.newPlot("tempGraph", tempChartData, layout, {
          displayModeBar: false
        });
        Plotly.newPlot("humGraph", humChartData, layout, {
          displayModeBar: false
        });
      })
      .catch(err => console.log("Error: ", err));
  });
}
