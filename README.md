# MHGU Quest List

This is a very quick implementation of a monster hunter generations ultimate quest list intended to make it easy to find key quests on mobile.

This information is already available in a few places, but generally filled with ads and/or not optimized for mobile.

Data is screen scraped from [Kiranico](https://mhgu.kiranico.com/quest) 
using Node.js and jQuery (See `scrape.js`).

Then, quest data is written as JSON which is loaded by the web interface.
