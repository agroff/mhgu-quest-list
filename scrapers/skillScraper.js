const BaseScraper = require("./baseScraper");

class SkillScraper extends BaseScraper {
    constructor() {
        super();
    }

    getSkills() {
        const skills = {};
        const $ = this.$;
        const $skillTables = $("table");

        $skillTables.each((i, el) => {
            const skillAttributes = [];
            $("th", el).each((i, th) => {
                skillAttributes.push($.trim($(th).text()));
            });

            const name = $.trim(skillAttributes[1].split('+')[0]);
            const rating = parseInt(skillAttributes.pop(), 10);
            const category = skillAttributes.pop();
            const key = name.toLowerCase().replace(/[^a-z]+/g, '');

            skills[key] = {
                name: name, 
                category: category,
                rating: rating,
            }

            console.log("fetching: " , skills);
        });

        return skills;
    }

    parse() {
        const skills = this.getSkills();

        this.writeJson("skillMeta", skills);
    }

    getUrl(uri) {
        return "https://www.reddit.com/r/MonsterHunter/wiki/mhguskills";
    }

    scrape() {
        this.getHtml('skills', (html) => {
            this.setJquery(html);
            this.parse();
        });
    }
}

module.exports = SkillScraper;