var initialized = false;

var openWeatherURLString = 'http://api.openweathermap.org/data/2.5/weather?lat=|lat|&lon=|lon|&APPID=8ad8e7344dd24094a3cd4eef1afd0a89';

localStorage.setItem('Fahrenheit', localStorage.getItem('Fahrenheit') ? localStorage.getItem('Fahrenheit') : 'false');
localStorage.setItem('WindSpeedUnits', localStorage.getItem('WindSpeedUnits') ? localStorage.getItem('WindSpeedUnits') : 'mps');
localStorage.setItem('WeatherProvider', localStorage.getItem('WeatherProvider') ? localStorage.getItem('WeatherProvider') : openWeatherURLString);

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
   if (localStorage.getItem('Fahrenheit') == 'true')
   {
      return Math.round((tempCelcius*1.8)+32);
   }
   else
   {
      return Math.round(tempCelcius);
   }
}

function ConvertToReleventWindSpeedString(windMps)
{  
   if (localStorage.getItem('WindSpeedUnits') == 'mph')
   {
      var mphWindSpeed = (windMps / 1609.344) * 3600;
      return (Math.round(mphWindSpeed*100)/100).toString().concat("mph");
   }
   else if (localStorage.getItem('WindSpeedUnits') == 'kph')
   {
      var kphWindSpeed = (windMps * 3600)/1000;
      return (Math.round(kphWindSpeed*100)/100).toString().concat("km/h");
   }
   else
   {
      return (Math.round(windMps*100)/100).toString().concat("m/s");
   }
}

function processYahooData(response)
{
   var celsiusTemp = (response.query.results.channel.item.condition.temp - 32) * 5 / 9;
   var windMps = (response.query.results.channel.wind.speed * 1609.344) / 3600;
   var textDescription = response.query.results.channel.item.condition.text;
   var Name = response.query.results.channel.location.city;
   var humidityMeasurement = response.query.results.channel.atmosphere.humidity;

   var Temp               = ConvertToReleventTemp(celsiusTemp);
   var WindSpeed          = ConvertToReleventWindSpeedString(windMps);
   var Humidity           = humidityMeasurement;
   var WaterVaporPressure = (Humidity / 100 ) * 6.105 * Math.exp((17.27 * (celsiusTemp)) / (237.7 + (celsiusTemp)));
   var ApparentTemp       = ConvertToReleventTemp(((celsiusTemp) + (0.33*WaterVaporPressure) - (0.7*windMps) - 4));
   var Details            = textDescription.concat("\nHumidity: ",Humidity,"%\nWind: ",WindSpeed);
   
   pushToPebble(Name.toString(), Details.toString(), Temp.toString(), ApparentTemp.toString());
}
function processOpenWeatherData(response)
{
   var Name               = response.name;
   var Temp               = ConvertToReleventTemp(response.main.temp - 273.15);
   var WindSpeed          = ConvertToReleventWindSpeedString(response.wind.speed);
   var Humidity           = response.main.humidity;
   var WaterVaporPressure = (Humidity / 100 ) * 6.105 * Math.exp((17.27 * (response.main.temp - 273.15)) / (237.7 + (response.main.temp - 273.15)));
   var ApparentTemp       = ConvertToReleventTemp(((response.main.temp - 273.15) + (0.33*WaterVaporPressure) - (0.7*response.wind.speed) - 4));
   var Details            = response.weather[0].description.concat("\nHumidity: ",Humidity,"%\nWind: ",WindSpeed);
   
   pushToPebble(Name.toString(), Details.toString(), Temp.toString(), ApparentTemp.toString());
}

function processWeatherDataSuccess(weatherDataUrl)
{
  var request = new XMLHttpRequest();
  console.log(weatherDataUrl);
  request.open('GET', weatherDataUrl, true);
  request.onload = function(e) {
    if (request.readyState == 4) {
      if(request.status == 200) {
        console.log(request.responseText);
        var response = JSON.parse(request.responseText);
        
        if (response) {
           var weatherProviderUrl = localStorage.getItem('WeatherProvider');
           if (weatherProviderUrl.indexOf('query.yahooapis.com') != -1)
           {
              processYahooData(response);
           }
           //put any new weather API's in here
           else
           {
              processOpenWeatherData(response); 
           }
            console.log("Weather data sent!");
        }
      } else {
        console.log("status != 200");
        processWeatherDataFailure("Weather API status != 200");
      }
    } else {
      console.log("Ready state != 4");
      processWeatherDataFailure("Ready state != 4");
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
   var weatherUrl = localStorage.getItem('WeatherProvider');
   weatherUrl = weatherUrl.replace('|lat|', pos.coords.latitude);
   weatherUrl = weatherUrl.replace('|lon|', pos.coords.longitude);
   processWeatherDataSuccess(weatherUrl);
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
   
   var weatherProviderTag = 'openweather';
   var weatherProviderUrl = localStorage.getItem('WeatherProvider');
   if (weatherProviderUrl.indexOf('query.yahooapis.com') != -1)
   {
      weatherProviderTag = 'yahoo';
   }
   //put any new weather API's in here
   else
   {
      weatherProviderTag = 'openweather';
   }
   
   var options = {'Fahrenheit':localStorage.getItem('Fahrenheit'), 'WindSpeedUnits':localStorage.getItem('WindSpeedUnits'), 'WeatherProvider':weatherProviderTag};
   Pebble.openURL('http://rawgit.com/jtcgreyfox/PBWeather/master/Config/pebbleConfigPageLoader.html?'+encodeURIComponent(JSON.stringify(options)));
   console.log("urioptions " + encodeURIComponent(JSON.stringify(options)));
});

Pebble.addEventListener("webviewclosed", function(e) {
  console.log("configuration closed");
  if (e.response.charAt(0) == "{" && e.response.slice(-1) == "}" && e.response.length > 5) {
    localStorage.setItem('Fahrenheit', JSON.parse(decodeURIComponent(e.response)).Fahrenheit);
    localStorage.setItem('WindSpeedUnits', JSON.parse(decodeURIComponent(e.response)).WindSpeedUnits);
    
    switch(JSON.parse(decodeURIComponent(e.response)).WeatherProvider)
    {
       case 'yahoo':
          console.log("yahoo chosen");
          localStorage.setItem('WeatherProvider', 'https://query.yahooapis.com/v1/public/yql?q=select%20location%2C%20wind%2C%20item.condition%2C%20atmosphere%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.placefinder%20where%20text%3D%22|lat|%2C|lon|%22%20and%20gflags%3D%22R%22)&format=json&diagnostics=true&callback=');
          break;
       //put any new weather API's in here
       default:
          console.log("default chosen (openweather)");
          localStorage.setItem('WeatherProvider', openWeatherURLString);
    }
    
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  } else {
    console.log("Cancelled");
  }
});