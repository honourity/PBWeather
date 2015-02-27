var initialized = false;
var options = {'Fahrenheit':'false'};

function pushToPebble(KEY_LOCA, KEY_DESC, KEY_TEMP, KEY_APPT)
{
   Pebble.sendAppMessage({
      'KEY_LOCA': KEY_LOCA,
      'KEY_DESC': KEY_DESC,
      'KEY_TEMP': KEY_TEMP,
      'KEY_APPT': KEY_APPT
   });
}

function ConvertToReleventTemp(tempCelcius)
{
   //var options = JSON.parase(options);
   if (options.Fahrenheit == 'true')
   {
      return Math.round((tempCelcius*1.8)+32);
   }
   else
   {
      return Math.round(tempCelcius);
   }
}

function processWeatherDataSuccess(locationMessage)
{
  var weatherDataUrl = 'http://api.openweathermap.org/data/2.5/weather?' + locationMessage;
  var request = new XMLHttpRequest();
  console.log(weatherDataUrl);
  request.open('GET', weatherDataUrl, true);
  request.onload = function(e) {
    if (request.readyState == 4) {
      if(request.status == 200) {
        console.log(request.responseText);
        var response = JSON.parse(request.responseText);
        if (response) {
            var Name               = response.name;
            var Temp               = ConvertToReleventTemp(response.main.temp - 273.15);
            var WindSpeed          = response.wind.speed;
            var Humidity           = response.main.humidity;
            var WaterVaporPressure = (Humidity / 100 ) * 6.105 * Math.exp((17.27 * (response.main.temp - 273.15)) / (237.7 + (response.main.temp - 273.15)));
            var ApparentTemp       = ConvertToReleventTemp(((response.main.temp - 273.15) + (0.33*WaterVaporPressure) - (0.7*WindSpeed) - 4));
            var Details            = response.weather[0].description.concat("\nHumidity: ",Humidity,"%\nWind: ",WindSpeed,"m/s");
            pushToPebble(Name.toString(), Details.toString(), Temp.toString(), ApparentTemp.toString());
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
function processWeatherDataFailure(errorMessage)
{
   pushToPebble("ERROR", errorMessage.toString(), "", "");
   console.log("Weather data ERROR sent!");
}

var locationOptions = {
  enableHighAccuracy: true, 
  maximumAge: 10000, 
  timeout: 10000
};
function locationSuccess(pos)
{
  var locationMessage = 'lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude;
  console.log(locationMessage);
  processWeatherDataSuccess(locationMessage);
}
function locationError(err)
{
  var errorMessage = 'error [' + err.code + ']: ' + err.message;
  console.log(errorMessage);
  processWeatherDataFailure(errorMessage);
}
Pebble.addEventListener('ready', function(e) {
  console.log('PebbleKit JS Ready!');
  console.log('Sending data...');
  navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  initialized = true;
});

Pebble.addEventListener("showConfiguration", function() {
  console.log("showing configuration");
  Pebble.openURL('http://rawgit.com/jtcgreyfox/PBWeather/master/Config/pebbleConfigPageLoader.html?'+encodeURIComponent(JSON.stringify(options)));
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("configuration closed");
  // webview closed
  //Using primitive JSON validity and non-empty check
  if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
    options = JSON.parse(decodeURIComponent(e.response));
    console.log("Options = " + JSON.stringify(options));
  } else {
    console.log("Cancelled");
  }
});