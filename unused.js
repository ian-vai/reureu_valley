function populateHeatMap(deviceName) {
  console.log("heatmap test running");
  /*=====
    ------- This is a query to the Database to get a months worth of a device. for testing for heatmap.
    ======*/

  const dataUrl =
    "https://0d664ca0-3c79-4620-a429-b55e8512d0c5-bluemix.cloudant.com/device_data/_find";

  const optionsMonthDevice = {
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
          $eq: "device-farmname-0013"
        },
        created: {
          $regex: "2018-03"
        }
      },
      fields: ["_id", "device_name", "temperature", "humidity", "created"],
      sort: [
        {
          created: "asc" //get the most recent records for this device
        }
      ]
    })
  };
  //note: the cloundant query above is probably better done as a cloudant search,
  //see: https://stackoverflow.com/questions/43055347/cloudant-how-to-perform-wildcard-searches-on-text-fields/43062534

  //get a specific month of device data
  const singleMonthDataPromise = new Promise(resolve => {
    fetch(dataUrl, optionsMonthDevice)
      .then(res => res.json())
      .then(monthSingle => {
        // resolve(data)
        console.log("months worth of device data");
        console.log(monthSingle);
      })
      .catch(err => console.log("Error: ", err));
  });
} //END heatmap function
