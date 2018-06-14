//create google map
var map;
function initMap() {
  let now = new Date().toString();
  console.log("interface updated @: " + now);

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 17,
    center: new google.maps.LatLng(-40.082, 175.475),
    mapTypeId: "satellite",
    disableDefaultUI: true
  });

  //Close open infowindows when map is clicked
  map.addListener("click", function(event) {
    closeAllInfoWindows(map);
  });

  initDataForMap();
}

//update dashboard every 5mins (aka 300000 milliseconds)
window.setInterval(initDataForMap, 300000);

var markers = [];
var circles = [];
