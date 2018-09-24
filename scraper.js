const QuestScraper = require("./scrapers/questScraper");
const WeaponScraper = require("./scrapers/weaponScraper");

const questScraper = new QuestScraper();
const weaponScraper = new WeaponScraper();

//questScraper.scrape();

weaponScraper.scrape("hammer");