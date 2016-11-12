/* global Module */

/* Magic Mirror
 * Module: MMM-Weather-SMHI
 *
 * By Fredrick Bäcker
 * MIT Licensed.
 */

Module.register("MMM-Weather-SMHI",{

	// Default module config.
	defaults: {
		url: "http://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/%s/lat/%s/data.json",
		lon: 0,
		lat: 0,

		useBeaufort: true,
		units: config.units,
		maxNumberOfDays: 7,
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		lang: config.language,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.

		initialLoadDelay: 2500, // 2.5 seconds delay. This delay is used to keep the OpenWeather API happy.
		retryDelay: 2500,

		iconTable: {
			1: ["sky wi-day-sunny","wi-night-clear"],
			2: ["sky wi-day-cloudy","wi-night-partly-cloudy"],
			3: ["wi-day-cloudy","wi-night-alt-cloudy"],
			4: ["wi-day-cloudy-high","wi-night-alt-cloudy"],
			5: ["wi-day-cloudy","wi-night-cloudy"],
			6: ["wi-day-sleet","wi-night-alt-sleet"],
			7: ["wi-day-fog","wi-night-fog"],
			8: ["wi-day-showers","wi-night-alt-showers"],
			9: ["wi-day-lightning","wi-night-alt-lightning"],
			10: ["wi-day-sleet","wi-night-alt-sleet"],
			11: ["wi-day-snow","wi-night-snow"],
			12: ["wi-day-rain","wi-night-rain"],
			13: ["wi-day-lightning","wi-night-lightning"],
			14: ["wi-day-snow","wi-night-alt-sleet"],
			15: ["wi-day-snow","wi-night-snow"],
		},
	},

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define required scripts.
	getStyles: function() {
		return ["weather-icons.css", "MMM-Weather-SMHI.css"];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	// Get formated string, example
	// stringFormat("%s, %s and %s", ["Me", "myself", "I"]); // "Me, myself and I"
	stringFormat: function(theString, argumentArray) {
		var regex = /%s/;
		var _r = function(p,c){return p.replace(regex,c);};
		return argumentArray.reduce(_r, theString);
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.list = [];
		this.forecast = [];
		this.current = null;
		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;

	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.lon === "" || this.config.lon === 0) {
			wrapper.innerHTML = "Please set the MMM-Weather-SMHI <i>lon</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.lat === "" || this.config.lat === 0) {
			wrapper.innerHTML = "Please set the MMM-Weather-SMHI <i>lat</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		}


		// CURRENT
		var small = document.createElement("span");
		small.className = "normal medium";

		var windIcon = document.createElement("span");
		windIcon.className = "wi wi-strong-wind dimmed";
		small.appendChild(windIcon);

		var speed = this.current.wind;
		if (this.config.useBeaufort){
			speed = this.ms2Beaufort(this.roundValue(speed));
		}else {
			speed = parseFloat(speed).toFixed(0);
		}
		var windSpeed = document.createElement("span");
		windSpeed.innerHTML = " " + speed;
		var windSpeedMark = document.createElement("sup");
		windSpeedMark.innerHTML = (this.config.useBeaufort) ? 'b':'s';
		small.appendChild(windSpeed);
		small.appendChild(windSpeedMark);

		if (this.config.showWindDirection) {
			var windDirection = document.createElement("sup");
			windDirection.innerHTML = " " + this.deg2Cardinal(this.current.direction);
			small.appendChild(windDirection);
		}
		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";
		small.appendChild(spacer);
/*
		var sunriseSunsetIcon = document.createElement("span");
		sunriseSunsetIcon.className = "wi dimmed " + this.sunriseSunsetIcon;
		small.appendChild(sunriseSunsetIcon);

		var sunriseSunsetTime = document.createElement("span");
		sunriseSunsetTime.innerHTML = " " + this.sunriseSunsetTime;
		small.appendChild(sunriseSunsetTime);
*/
		var large = document.createElement("div");
		large.className = "large light";

		var weatherIcon = document.createElement("span");
		weatherIcon.className = "wi weather-icon-large " + this.current.icon;
		large.appendChild(weatherIcon);

		var temperature = document.createElement("span");
		temperature.className = "bright";
		temperature.innerHTML = " " + this.current.temp + "&deg;";
		large.appendChild(temperature);

		large.insertBefore(small,weatherIcon);
		wrapper.appendChild(large);

		// FORECAST
		var table = document.createElement("table");
		table.className = "small";

		for (var f in this.forecast) {
			var forecast = this.forecast[f];

			var row = document.createElement("tr");
			table.appendChild(row);

			var dayCell = document.createElement("td");
			dayCell.className = "day";
			dayCell.innerHTML = forecast[0].day;
			row.appendChild(dayCell);

			var iconCell = document.createElement("td");
			iconCell.className = "bright weather-icon";
			row.appendChild(iconCell);

			var icon = document.createElement("span");
			icon.className = "wi weathericon " + forecast[0].icon;
			iconCell.appendChild(icon);

			var maxTempCell = document.createElement("td");
			maxTempCell.innerHTML = forecast[0].temp + "&deg;";
			maxTempCell.className = "align-right bright max-temp";
			row.appendChild(maxTempCell);

			iconCell = document.createElement("td");
			iconCell.className = "weather-icon1";
			row.appendChild(iconCell);

			icon = document.createElement("span");
			icon.className = "wi weather-icon " + forecast[1].icon;
			iconCell.appendChild(icon);

			var minTempCell = document.createElement("td");
			minTempCell.innerHTML = forecast[1].temp + "&deg;";
			minTempCell.className = "align-right min-temp";
			row.appendChild(minTempCell);

			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = this.forecast.length * this.config.fadePoint;
				var steps = this.forecast.length - startingPoint;
				if (f >= startingPoint) {
					var currentStep = f - startingPoint;
					row.style.opacity = 1 - (1 / steps * currentStep);
				}
			}

		}


		var header = document.createElement("header");
		header.innerHTML = 'Weather Forecast';
		wrapper.appendChild(header);
		wrapper.appendChild(table);

		return wrapper;
	},

	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {

		var url = this.stringFormat(this.config.url,[ this.config.lon, this.config.lat]);
		var self = this;
		var retry = true;

		var weatherRequest = new XMLHttpRequest();
		weatherRequest.open("GET", url, true);
		weatherRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processWeather(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.config.appid = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Load issue.");
					retry = false;
				} else {
					Log.error(self.name + ": Could not load weather.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		weatherRequest.send();
	},


	/* processWeather(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processWeather: function(data) {

		this.list = [];
		this.forecast = [];
		this.current = null;
		var closest = 50000;
		var day = null;
		var dayIndex = -1;

		for (var i = 0, count = data.timeSeries.length; i < count; i++) {

			var forecast = data.timeSeries[i];

			var item = {
				time: moment(forecast.validTime),
				day: moment(moment(forecast.validTime), "X").format("ddd"),
				icon: this.processWeatherGetItem("Wsymb",forecast),
				temp: parseFloat(this.roundValue(this.processWeatherGetItem("t",forecast))),
				wind: parseFloat(this.roundValue(this.processWeatherGetItem("ws",forecast))),
				direction: parseFloat(this.roundValue(this.processWeatherGetItem("wd",forecast))),
				cloud: parseFloat(this.roundValue(this.processWeatherGetItem("tcc_mean",forecast)))
			};

			if( item.time.diff(moment(),'days') > 4 )
				break;

			this.list.push(item);

			if(item.day!=day){
				day = item.day;
				dayIndex++;
			}
			if(this.forecast[dayIndex]==null)
				this.forecast[dayIndex] = [];

			// Save current (closest to clock)
			var timeFromNow = Math.abs(item.time.diff(moment(),'minutes'));
			if(timeFromNow < closest){
				closest = timeFromNow;
				this.current = item;
			}


			// Save forecast
			var timeFormat = item.time.format("YYYY-MM-DD");
			var timeDay = moment(timeFormat+" 12:00", "YYYY-MM-DD HH:mm");
			var timeNight = moment(timeFormat+" 23:59", "YYYY-MM-DD HH:mm");
			var timeFromNowDay = Math.abs(item.time.diff(timeDay,'minutes'));
			var timeFromNowNight = Math.abs(item.time.diff(timeNight,'minutes'));

			// set first
			if(this.forecast[dayIndex][0]==null){
				this.forecast[dayIndex][0] = this.processWeatherCreateItem(0,item,timeFromNowDay);
				this.forecast[dayIndex][1] = this.processWeatherCreateItem(1,item,timeFromNowNight);
			}
			else{
				if(timeFromNowDay<this.forecast[dayIndex][0].diff){
					this.forecast[dayIndex][0] = this.processWeatherCreateItem(0,item,timeFromNowDay);
				}
				else if(timeFromNowNight<this.forecast[dayIndex][1].diff){
					this.forecast[dayIndex][1] = this.processWeatherCreateItem(1,item,timeFromNowNight);
				}

			}

		}

		//Log.log(this.forecast);

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	processWeatherGetItem(id,data){
		for (var i = 0, count = data.parameters.length; i < count; i++) {
			var param = data.parameters[i];
			if(param.name===id)
				return param.values[0];
		}
		return null;
	},

	processWeatherCreateItem(index,item,diff){
		item.diff = diff;
		if(!isNaN(item.icon))
			item.icon = this.config.iconTable[item.icon][index];
		return item;
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.updateWeather();
		}, nextLoad);
	},

	/* ms2Beaufort(ms)
	 * Converts m2 to beaufort (windspeed).
	 *
	 * argument ms number - Windspeed in m/s.
	 *
	 * return number - Windspeed in beaufort.
	 */
	ms2Beaufort: function(ms) {
		var kmh = ms * 60 * 60 / 1000;
		var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
		for (var beaufort in speeds) {
			var speed = speeds[beaufort];
			if (speed > kmh) {
				return beaufort;
			}
		}
		return 12;
	},

	/* function(temperature)
	 * Rounds a temperature to 1 decimal.
	 *
	 * argument temperature number - Temperature.
	 *
	 * return number - Rounded Temperature.
	 */

	deg2Cardinal: function(deg) {
      if (deg>11.25 && deg<=33.75){
              return "NNE";
      } else if (deg > 33.75 && deg <= 56.25) {
              return "NE";
      } else if (deg > 56.25 && deg <= 78.75) {
              return "ENE";
      } else if (deg > 78.75 && deg <= 101.25) {
              return "E";
      } else if (deg > 101.25 && deg <= 123.75) {
              return "ESE";
      } else if (deg > 123.75 && deg <= 146.25) {
              return "SE";
      } else if (deg > 146.25 && deg <= 168.75) {
              return "SSE";
      } else if (deg > 168.75 && deg <= 191.25) {
              return "S";
      } else if (deg > 191.25 && deg <= 213.75) {
              return "SSW";
      } else if (deg > 213.75 && deg <= 236.25) {
              return "SW";
      } else if (deg > 236.25 && deg <= 258.75) {
              return "WSW";
      } else if (deg > 258.75 && deg <= 281.25) {
              return "W";
      } else if (deg > 281.25 && deg <= 303.75) {
              return "WNW";
      } else if (deg > 303.75 && deg <= 326.25) {
              return "NW";
      } else if (deg > 326.25 && deg <= 348.75) {
              return "NNW";
      } else {
               return "N";
      }
	},


	roundValue: function(value) {
		return parseFloat(value).toFixed(1);
	}
});
