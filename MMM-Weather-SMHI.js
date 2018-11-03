/* global Module */

/* Magic Mirror
 * Module: MMM-Weather-SMHI
 *
 * By Fredrick Bäcker
 * MIT Licensed.
 */

Module.register("MMM-Weather-SMHI", {
	// Default module config.
	defaults: {
		url:
			"http://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/%s/lat/%s/data.json",
		lon: 0,
		lat: 0,

		useBeaufort: true,
		showWindDirection: false,
		windDirectionMode: 0,
		showDailyWindInfo: false,
		showDailyRainInfo: false,
		tempDecimals: 1,
		
		units:
			config.units,
		maxNumberOfDays: 5,
		updateInterval:
			10 *
			60 *
			1000, // every 10 minutes
		animationSpeed: 1000,
		timeFormat:
			config.timeFormat,
		lang:
			config.language,
		fade: true,
		fadePoint: 0.25, // Start on 1/4th of the list.
		title:
			"Weather Forecast",

		initialLoadDelay: 2500, // 2.5 seconds delay. This delay is used to keep the OpenWeather API happy.
		retryDelay: 2500,

		wdirDegreeToText: [
			"N", "NNE", "NE", "ENE",
			"E", "ESE", "SE", "SSE",
			"S", "SSW", "SW", "WSW",
			"W", "WNW", "NW", "NNW",
			"N"
		],
		
		iconTable: {
			1: [	// SMHI: Clear sky
				"wi-day-sunny",
				"wi-night-clear"
			],			
			2: [	// SMHI: Nearly clear sky
				"wi-day-sunny-overcast",
				"wi-night-partly-cloudy"
			],
			3: [	// SMHI: Variable cloudness
				"wi-day-cloudy",
				"wi-night-alt-cloudy"
			],
			4: [	// SMHI: Halfclear sky
				"wi-day-cloudy",
				"wi-night-alt-cloudy"
			],
			5: [	// SMHI: Cloudy sky
				"wi-day-cloudy",
				"wi-night-alt-cloudy"
			],
			6: [	// SMHI: Overcast
				"wi-cloudy",
				"wi-cloudy"
			],
			7: [	// SMHI: Fog
				"wi-day-fog",
				"wi-night-fog"
			],
			8: [	// SMHI: Light rain showers
				"wi-day-showers",
				"wi-night-alt-showers"
			],
			9: [	// SMHI: Moderate rain showers
				"wi-day-showers",
				"wi-night-alt-showers"
			],
			10: [	// SMHI: Heavy rain showers
				"wi-day-showers",
				"wi-night-alt-showers"
			],
			11: [	// SMHI: Thunderstorm
				"wi-day-thunderstorm",
				"wi-night-alt-thunderstorm"
			],
			12: [	// SMHI: Light sleet showers
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			13: [	// SMHI: Moderate sleet showers
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			14: [	// SMHI: Heavy sleet showers
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			15: [	// SMHI: Light snow showers
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			16: [	// SMHI: Moderate snow showers
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			17: [	// SMHI: Heavy snow showers
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			18: [	// SMHI: Light rain
				"wi-day-rain",
				"wi-night-alt-rain"
			],
			19: [	// SMHI: Moderate rain
				"wi-day-rain",
				"wi-night-alt-rain"
			],
			20: [	// SMHI: Heavy rain
				"wi-day-rain",
				"wi-night-alt-rain"
			],
			21: [	// SMHI: Thunder
				"wi-day-lightning",
				"wi-night-alt-lightning"
			],
			22: [	// SMHI: Light sleet
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			23: [	// SMHI: Moderate sleet
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			24: [	// SMHI: Heavy sleet
				"wi-day-sleet",
				"wi-night-alt-sleet"
			],
			25: [	// SMHI: Light snowfall
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			26: [	// SMHI: Moderate snowfall
				"wi-day-snow",
				"wi-night-alt-snow"
			],
			27: [	// SMHI: Heavy snowfall
				"wi-day-snow",
				"wi-night-alt-snow"
			]
		}
	},

	// Define required scripts.
	getScripts: function() {
		return [
			"moment.js"
		];
	},

	// Define required scripts.
	getStyles: function() {
		return [
			"weather-icons.css",
			"weather-icons-wind.css",
			"MMM-Weather-SMHI.css"
		];
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
	stringFormat: function(
		theString,
		argumentArray
	) {
		var regex = /%s/;
		var _r = function(
			p,
			c
		) {
			return p.replace(
				regex,
				c
			);
		};
		return argumentArray.reduce(
			_r,
			theString
		);
	},

	// Define start sequence.
	start: function() {
		Log.info(
			"Starting module: " +
				this
					.name
		);

		// Set locale.
		moment.locale(
			config.language
		);

		this.list = [];
		this.forecast = [];
		this.current = null;
		this.loaded = false;
		this.scheduleUpdate(
			this
				.config
				.initialLoadDelay
		);

		this.updateTimer = null;
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement(
			"div"
		);

		if (
			this
				.config
				.lon ===
				"" ||
			this
				.config
				.lon ===
				0
		) {
			wrapper.innerHTML =
				"Please set the MMM-Weather-SMHI <i>lon</i> in the config for module: " +
				this
					.name +
				".";
			wrapper.className =
				"dimmed light small";
			return wrapper;
		}

		if (
			this
				.config
				.lat ===
				"" ||
			this
				.config
				.lat ===
				0
		) {
			wrapper.innerHTML =
				"Please set the MMM-Weather-SMHI <i>lat</i> in the config for module: " +
				this
					.name +
				".";
			wrapper.className =
				"dimmed light small";
			return wrapper;
		}

		if (
			!this
				.loaded
		) {
			wrapper.innerHTML = this.translate(
				"LOADING"
			);
			wrapper.className =
				"dimmed light small";
			return wrapper;
		}

		// CURRENT
		var small = document.createElement(
			"span"
		);
		small.className =
			"normal medium";

		var windIcon = document.createElement(
			"span"
		);
		windIcon.className =
			"wi wi-strong-wind dimmed";
		small.appendChild(
			windIcon
		);

		var speed = this
			.current
			.wind;
		if (
			this
				.config
				.useBeaufort
		) {
			speed = this.ms2Beaufort(
				this.roundValue(
					speed
				)
			);
		} else {
			speed = parseFloat(
				speed
			).toFixed(
				0
			);
		}
		var windSpeed = document.createElement(
			"span"
		);
		windSpeed.innerHTML =
			" " +
			speed;
		var windSpeedMark = document.createElement(
			"sup"
		);
		windSpeedMark.innerHTML = this
			.config
			.useBeaufort
			? "b"
			: "s";
		small.appendChild(
			windSpeed
		);
		small.appendChild(
			windSpeedMark
		);

		if (
			this
				.config
				.showWindDirection
		) {
			if (
				this
					.config
					.windDirectionMode == 0
			) {
				var windDirection = document.createElement(
					"sup"
				);
				windDirection.innerHTML =
					" " +
					this.deg2Cardinal(
						this
							.current
							.direction
					);
				small.appendChild(
					windDirection
				);
			}
			else {
				var windDirection = document.createElement(
					"span"
				);
				windDirection.className =
					"wi wi-wind from-" +
						parseFloat(
							this
								.current
								.direction
						).toFixed(
							0
						) +
					"-deg";
				small.appendChild(
					windDirection
				);
			}
		}
		var spacer = document.createElement(
			"span"
		);
		spacer.innerHTML =
			"&nbsp;";
		small.appendChild(
			spacer
		);
		var large = document.createElement(
			"div"
		);
		large.className =
			"large light";

		var weatherIcon = document.createElement(
			"span"
		);
		weatherIcon.className =
			"bright wi weather-icon-large " +
			this
				.current
				.icon;
		large.appendChild(
			weatherIcon
		);

		var temperature = document.createElement(
			"span"
		);
		temperature.className =
			"bright";
		temperature.innerHTML =
			" " +
			this
				.current
				.temp +
			"&deg;";
		large.appendChild(
			temperature
		);

		large.insertBefore(
			small,
			weatherIcon
		);
		wrapper.appendChild(
			large
		);

		// FORECAST
		var table = document.createElement(
			"table"
		);
		table.className =
			"small";

		for (var f in this
			.forecast) {
			var forecast = this
				.forecast[
					f
				];

			var row = document.createElement(
				"tr"
			);
			table.appendChild(
				row
			);

			var dayCell = document.createElement(
				"td"
			);
			dayCell.className =
				"day";
			dayCell.innerHTML =
				forecast[0].day;
			row.appendChild(
				dayCell
			);

			var maxTempCell = document.createElement(
				"td"
			);
			maxTempCell.className =
				"temp-daily bright";
			maxTempCell.innerHTML =
				forecast[0]
					.temp +
				"&deg;";
			row.appendChild(
				maxTempCell
			);

			var iconCell = document.createElement(
				"td"
			);
			iconCell.className =
				"bright weather-icon";
			row.appendChild(
				iconCell
			);

			var icon = document.createElement(
				"span"
			);
			icon.className =
				"wi weathericon " +
				forecast[0]
					.icon;
			iconCell.appendChild(
				icon
			);

			var minTempCell = document.createElement(
				"td"
			);
			minTempCell.className =
				"temp-daily";
			minTempCell.innerHTML =
				forecast[1]
					.temp +
				"&deg;";
			row.appendChild(
				minTempCell
			);

			iconCell = document.createElement(
				"td"
			);
			iconCell.className =
				"weather-icon";
			row.appendChild(
				iconCell
			);

			icon = document.createElement(
				"span"
			);
			icon.className =
				"wi weathericon " +
				forecast[1]
					.icon;
			iconCell.appendChild(
				icon
			);

			// possibly add day wind speed information
 			if (
				this
					.config
					.showDailyWindInfo
			) {
				var windSpeedCell = document.createElement(
					"td"
				);
				windSpeedCell.className =
					"windspeed-daily";

				var speed = 
					forecast[0]
						.wind;
				if (
					this
						.config
						.useBeaufort
				) {
					speed = this.ms2Beaufort(
						this.roundValue(
							speed
						)
					);
				} else {
					speed = parseFloat(
						speed
					).toFixed(
						0
					);
				}

				windSpeedCell.innerHTML =
					" " +
					speed;
				var windSpeedMark = document.createElement(
					"sup"
				);
				windSpeedMark.innerHTML = this
					.config
					.useBeaufort
					? "b"
					: "s";
				windSpeedCell.appendChild(
					windSpeedMark
				);
				row.appendChild(
					windSpeedCell
				);
				
				// possibly add wind direction information
 				if (
					this
						.config
						.showWindDirection
				) {
					var windDirCell = document.createElement(
						"td"
					);
					windDirCell.className =
						"direction-daily";
					if (
						this
							.config
							.windDirectionMode == 0
					) {
						var windDirection = document.createElement(
							"sup"
						);
						windDirection.innerHTML =
							" " +
							this.deg2Cardinal(
								forecast[0]
									.direction
							);
						windDirCell.appendChild(
							windDirection
						);
					}
					else {
						var windDirection = document.createElement(
							"span"
						);
						windDirection.className =
							"wi wi-wind from-" +
								parseFloat(
									forecast[0]
										.direction
								).toFixed(
									0
								) +
							"-deg";
						windDirCell.appendChild(
							windDirection
						);
					}
					row.appendChild(
						windDirCell
					);
				}

				// possibly add rain information
				if (
					this
						.config
						.showDailyRainInfo
				) {						
					var rainCell = document.createElement(
						"td"
					);
					rainCell.className =
						"rain-daily";

					var rainUnitMark = document.createElement(
						"span"
					);
					rainUnitMark.className = "mm-unit";
					rainUnitMark.innerHTML = "mm";

					rainCell.innerHTML =
						" " +
						parseFloat(
							forecast[1]
								.rainAcc
						).toFixed(
							1
						)
					rainCell.appendChild(
						rainUnitMark
					);
					row.appendChild(
						rainCell
					);
				}
			}

			if (
				this
					.config
					.fade &&
				this
					.config
					.fadePoint <
					1
			) {
				if (
					this
						.config
						.fadePoint <
					0
				) {
					this.config.fadePoint = 0;
				}
				var startingPoint =
					this
						.forecast
						.length *
					this
						.config
						.fadePoint;
				var steps =
					this
						.forecast
						.length -
					startingPoint;
				if (
					f >=
					startingPoint
				) {
					var currentStep =
						f -
						startingPoint;
					row.style.opacity =
						1 -
						1 /
							steps *
							currentStep;
				}
			}
		}

		var header = document.createElement(
			"header"
		);
		header.innerHTML = this.config.title;
		wrapper.appendChild(
			header
		);
		wrapper.appendChild(
			table
		);

		return wrapper;
	},

	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {
		var url = this.stringFormat(
			this
				.config
				.url,
			[
				this
					.config
					.lon
					.toFixed(4),
				this
					.config
					.lat
					.toFixed(4)
			]
		);
		var self = this;
		var retry = true;

		var weatherRequest = new XMLHttpRequest();
		weatherRequest.open(
			"GET",
			url,
			true
		);
		weatherRequest.onreadystatechange = function() {
			if (
				this
					.readyState ===
				4
			) {
				if (
					this
						.status ===
					200
				) {
					self.processWeather(
						JSON.parse(
							this
								.response
						)
					);
				} else if (
					this
						.status ===
					401
				) {
					self.config.appid =
						"";
					self.updateDom(
						self
							.config
							.animationSpeed
					);

					Log.error(
						self.name +
							": Load issue."
					);
					retry = false;
				} else {
					Log.error(
						self.name +
							": Could not load weather."
					);
				}

				if (
					retry
				) {
					self.scheduleUpdate(
						self.loaded
							? -1
							: self
								.config
								.retryDelay
					);
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
	processWeather: function(
		data
	) {
		this.list = [];
		this.forecast = [];
		this.current = null;
		var closest = 50000;
		var day = null;
		var dayIndex = -1;
		var rainAcc = 0;

		for (
			var i = 0,
				count =
					data
						.timeSeries
						.length;
			i <
			count;
			i++
		) {
			var forecast =
				data
					.timeSeries[
						i
					];

			var item = {
				time: moment(
					forecast.validTime
				),
				day: moment(
					moment(
						forecast.validTime
					),
					"X"
				).format(
					"ddd"
				),
				icon: this.processWeatherGetItem(
					"Wsymb2",
					forecast
				),
				temp: parseFloat(
					this.processWeatherGetItem(
						"t",
						forecast
					).toFixed(
						this
							.config
							.tempDecimals
					)
				),
				wind: parseFloat(
					this.roundValue(
						this.processWeatherGetItem(
							"ws",
							forecast
						)
					)
				),
				direction: parseFloat(
					this.roundValue(
						this.processWeatherGetItem(
							"wd",
							forecast
						)
					)
				),
				rain: this.processWeatherGetItem(
					"pmean",
					forecast
				),
				cloud: parseFloat(
					this.roundValue(
						this.processWeatherGetItem(
							"tcc_mean",
							forecast
						)
					)
				)
			};

			if (
				item.time.diff(
					moment().endOf('day'),
					"days"
				) >=
				this
					.config
					.maxNumberOfDays
			) {
				break;
			}

			this.list.push(
				item
			);

			if (
				item.day !=
				day
			) {
				day =
					item.day;
				dayIndex++;
				rainAcc = 0;
			}
			
			// Accumulate daily rain
			rainAcc =
				rainAcc +
				parseFloat(
					item.rain
				);

			if (
				this
					.forecast[
						dayIndex
					] ==
				null
			) {
				this.forecast[
					dayIndex
				] = [];
			}

			// Save current (closest to clock)
			var timeFromNow = Math.abs(
				item.time.diff(
					moment(),
					"minutes"
				)
			);
			if (
				timeFromNow <
				closest
			) {
				closest = timeFromNow;
				this.current = item;
			}

			// Save forecast
			var timeFormat = item.time.format(
				"YYYY-MM-DD"
			);
			var timeDay = moment(
				timeFormat +
					" 12:00",
				"YYYY-MM-DD HH:mm"
			);
			var timeNight = moment(
				timeFormat +
					" 23:59",
				"YYYY-MM-DD HH:mm"
			);
			var timeFromNowDay = Math.abs(
				item.time.diff(
					timeDay,
					"minutes"
				)
			);
			var timeFromNowNight = Math.abs(
				item.time.diff(
					timeNight,
					"minutes"
				)
			);

			// set first
			if (
				this
					.forecast[
						dayIndex
					][0] ==
				null
			) {
				this.forecast[
					dayIndex
				][0] = this.processWeatherCreateItem(
					0,
					item,
					rainAcc,
					timeFromNowDay
				);
				this.forecast[
					dayIndex
				][1] = this.processWeatherCreateItem(
					1,
					item,
					rainAcc,
					timeFromNowNight
				);
			} else {
				if (
					timeFromNowDay <
					this
						.forecast[
							dayIndex
						][0]
						.diff
				) {
					this.forecast[
						dayIndex
					][0] = this.processWeatherCreateItem(
						0,
						item,
						rainAcc,
						timeFromNowDay
					);
				} else if (
					timeFromNowNight <
					this
						.forecast[
							dayIndex
						][1]
						.diff
				) {
					this.forecast[
						dayIndex
					][1] = this.processWeatherCreateItem(
						1,
						item,
						rainAcc,
						timeFromNowNight
					);
				}
			}
		}

		//Log.log(this.forecast);

		this.loaded = true;
		this.updateDom(
			this
				.config
				.animationSpeed
		);
	},

	processWeatherGetItem(
		id,
		data
	) {
		for (
			var i = 0,
				count =
					data
						.parameters
						.length;
			i <
			count;
			i++
		) {
			var param =
				data
					.parameters[
						i
					];
			if (
				param.name ===
				id
			) {
				return param
					.values[0];
			}
		}
		return null;
	},

	processWeatherCreateItem(
		index,
		item,
		rainAcc,
		diff
	) {
		item.diff = diff;
		if (
			!isNaN(
				item.icon
			)
		) {
			item.icon = this.config.iconTable[
				item.icon
			][
				index
			];
		}
		
		item.rainAcc = rainAcc;
		
		return item;
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(
		delay
	) {
		var nextLoad = this
			.config
			.updateInterval;
		if (
			typeof delay !==
				"undefined" &&
			delay >=
				0
		) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(
			this
				.updateTimer
		);
		this.updateTimer = setTimeout(
			function() {
				self.updateWeather();
			},
			nextLoad
		);
	},

	/* ms2Beaufort(ms)
	 * Converts m2 to beaufort (windspeed).
	 *
	 * argument ms number - Windspeed in m/s.
	 *
	 * return number - Windspeed in beaufort.
	 */
	ms2Beaufort: function(
		ms
	) {
		var kmh =
			ms *
			60 *
			60 /
			1000;
		var speeds = [
			1,
			5,
			11,
			19,
			28,
			38,
			49,
			61,
			74,
			88,
			102,
			117,
			1000
		];
		for (var beaufort in speeds) {
			var speed =
				speeds[
					beaufort
				];
			if (
				speed >
				kmh
			) {
				return beaufort;
			}
		}
		return 12;
	},

	/* deg2Cardinal(windDir)
	 * Maps a wind direction in degrees
	 * to text, e.g. NNE.
	 *
	 * argument windDir number - Wind direction in degrees.
	 *
	 * return string - Wind direction in text.
	 */
	deg2Cardinal: function(
		deg
	) {
		return this
			.config
			.wdirDegreeToText[
				(((deg + 11.25) / 22.5) - 0.5)
					.toFixed(
						0
					)
			];
	},

	/* function(temperature)
	 * Rounds a temperature to 1 decimal.
	 *
	 * argument temperature number - Temperature.
	 *
	 * return number - Rounded Temperature.
	 */
	roundValue: function(
		value
	) {
		return parseFloat(
			value
		).toFixed(
			1
		);
	}
});
