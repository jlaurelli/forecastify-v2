# Foreclaustify

An agentic weather app: the user finds a place and sees its upcoming weather, with Claude as the agent. Successor to the original "forecastify".

## Finding a place

**Location**:
A named place on Earth, identified to the user by its name and country, plus its state or province when the country is the US or Canada, or when needed to tell it apart from a same-named place in the same country among the Suggestions being shown alongside it.
_Avoid_: City, place, area

**Location Search**:
The user typing a partial place name to find a Location.
_Avoid_: Lookup, autocomplete, geocode

**Suggestion**:
One of the up to five closest-matching Locations offered during a Location Search.
_Avoid_: Result, match, option

**Selected Location**:
The single Location whose Forecast is currently shown and which the Conversation is anchored to.
_Avoid_: Current location, active city

## Weather

**Forecast**:
The predicted weather for a Location over seven consecutive days, the first of which is today at that Location.
_Avoid_: Outlook, weather data

**Forecast Day**:
One day of a Forecast: its Condition, high and low temperature, chance of precipitation, maximum wind, sunrise and sunset (none on a day the sun neither rises nor sets), how warm its high and low feel, and peak UV index.
_Avoid_: Daily, tile, card

**Condition**:
The single overall kind of weather for a Forecast Day: Clear, Partly cloudy, Cloudy, Fog, Drizzle, Rain, Snow, or Thunderstorm.
_Avoid_: Weather type, icon, code

**Unit System**:
The user's choice of how temperature and wind are shown: metric (°C and km/h) or imperial (°F and mph). It defaults to imperial only in the US and its territories, is remembered between visits, and the agent answers in it too.
_Avoid_: Units, measurement, locale

**Radar**:
The precipitation observed around the Selected Location over the past two hours, shown as an animated map.
_Avoid_: Rain map, precipitation map, satellite

## Agent

**Forecast Brief**:
A short plain-language summary of the Selected Location's Forecast, given by the agent as an answer within the Conversation and only when the user asks for one.
_Avoid_: Summary, digest, report

**Conversation**:
The exchange of questions and agent answers about the Selected Location's Forecast; it may draw on Compared Locations, continues if the same Location is selected again, and ends — and is discarded — when a different Location is selected.
_Avoid_: Chat, thread, session

**Compared Location**:
A Location the agent finds on its own to answer a question in the Conversation; it never becomes the Selected Location. When its name is ambiguous, the agent asks which one is meant rather than guessing.
_Avoid_: Other location, second city
