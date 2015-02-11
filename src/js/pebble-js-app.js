var locationOptions = {
  enableHighAccuracy: true, 
  maximumAge: 10000, 
  timeout: 10000
};
function locationSuccess(pos) {
  var locationMessage = 'lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude;
  console.log(locationMessage);
  sendWeatherData(locationMessage, true);
}
function locationError(err) {
  var locationMessage = 'location error (' + err.code + '): ' + err.message;
  console.log(locationMessage);
  sendWeatherData(locationMessage, false);
}

function sendWeatherData(locationMessage, isActualLocation) {
  var weatherDataUrl = 'http://api.openweathermap.org/data/2.5/weather?';
  if (!isActualLocation) {
    weatherDataUrl = weatherDataUrl.concat("q=Sydney,au");
  } else {
    weatherDataUrl = weatherDataUrl.concat(locationMessage);
  }
  
  var request = new XMLHttpRequest();
  console.log(weatherDataUrl);
  request.open('GET', weatherDataUrl, true);
  request.onload = function(e) {
    if (request.readyState == 4) {
      if(request.status == 200) {
        console.log(request.responseText);
        var response = JSON.parse(request.responseText);
        if (response) {
          Pebble.sendAppMessage({
            'KEY_LOCA':response.name,
            'KEY_DESC':response.weather[0].description.concat("\nHumidity: ",response.main.humidity,"%\nWind: ",response.wind.speed,"m/s"),
            'KEY_TEMP':Math.round(response.main.temp - 273.15).toString()
          });
          console.log("Weather data sent!");
        }
      } else {
        console.log("status != 200");
      }
    } else {
      console.log("Ready state != 4");
    }
  };
  request.send(null);
}

Pebble.addEventListener('ready', function(e) {
  console.log('PebbleKit JS Ready!');
  console.log('Sending data...');
  
  navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  
  
});
