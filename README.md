# Magic Mirror 2 - Module
Module for https://github.com/MichMich/MagicMirror

# Module: Weather Current/Forecast SMHI
The `SMHI weather` module displays current weather and forecast for the week.
Forecast picks temperature closest to 12:00 and night 23:00

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
	{
		module: 'MMM-Weather-SMHI',
		position: 'top_right',	// This can be any of the regions.
									// Best results in left or right regions.
		config: {
			// See 'Configuration options' for more information.
			lon: xx.xxxx,
			lat: yy.yyyy,
		}
	}
]
````

## Configuration options

The following properties can be configured:

|Option|                  Description                  |                  Possible values                         | Default |
|------|-----------------------------------------------|----------------------------------------------------------|---------|
|`lon` |The location longitude for weather information.| xx.xxxx                                                  | |
|`lat` |The location latitude for weather information. | yy.yyyy                                                  | |
|`units`|What units to use. Specified by config.js - config.units | Kelvin, metric (Celsius), imperial (Fahrenheit)|*config.units* or Kelvin |
|`maxNumberOfDays`| How many days of forecast to return. Specified by config.js | 1-16 | 5 days |
|`updateInterval`| How often does the content needs to be fetched? (Milliseconds) | 1000-86400000 | 300000(10 minutes) |
|`animationSpeed`| Speed of the update animation. (Milliseconds)  | 0-5000 | 2000(2 seconds) |
|`useBeaufort`| Pick between using the Beaufort scale for wind speed or using the default units. | true, false | true |
|`lang`| The language of the days. | en, nl, ru, etc... | *config.language* |
|`fade`| Fade the future events to black. (Gradient) | true, false | true |
|`fadePoint`| Where to start fade? | 0-1 (0=top of list, 1=bottom of list) | 0,25 |
|`initialLoadDelay`| The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds) | 1000-5000 | 0 |
|`retryDelay`| The delay before retrying after a request failure. (Milliseconds) | 1000-60000 | 2500 |
|`title`| Title of the weather table. | Text | Weather Forecast |
