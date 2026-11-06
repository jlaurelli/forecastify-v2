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
One day of a Forecast: its condition, high and low temperature, chance of precipitation, and maximum wind.
_Avoid_: Daily, tile, card

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
