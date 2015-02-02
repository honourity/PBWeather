Pebble.addEventListener('ready', function(e) {
  console.log('PebbleKit JS Ready!');
  console.log('Sending data...');
  sendWeatherData();
});

function sendWeatherData() {
  var request = new XMLHttpRequest();
  request.open('GET', 'http://api.openweathermap.org/data/2.5/weather?q=Sydney,au', true);
  request.onload = function(e) {
    if (request.readyState == 4) {
      if(request.status == 200) {
        console.log(request.responseText);
        var response = JSON.parse(request.responseText);
        if (response) {
          var json = response;
          
          var temperature = Math.round(json.main.temp - 273.15);
          var description = json.weather[0].description;
          var location    = json.name + ', ' + json.sys.country;
          
          Pebble.sendAppMessage({
            'KEY_LOCA':location,
            'KEY_DESC':description,
            'KEY_TEMP':temperature
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