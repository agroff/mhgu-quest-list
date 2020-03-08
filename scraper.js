const QuestScraper = require("./scrapers/questScraper");
const WeaponScraper = require("./scrapers/weaponScraper");
const SkillScraper = require("./scrapers/skillScraper");

const questScraper = new QuestScraper();
const weaponScraper = new WeaponScraper();
const skillScraper = new SkillScraper();

//questScraper.scrape();
//weaponScraper.scrape("hammer");
skillScraper.scrape();