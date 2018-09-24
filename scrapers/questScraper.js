const BaseScraper = require("./baseScraper");

class QuestScraper extends BaseScraper {
    constructor() {
        super();

        this.villageKeyTypeOverride = {
            //Astalos/Kyoto Village
            "Slay the Velociprey!": "pre-req",
            "Hunt Down the Velocidrome!": "pre-req",
            "Local Threat": "pre-req",
            "Into the Wyvern's Den": "pre-req",
            "The Thunderclaw Wyvern": "pre-req",

            //Gammoth/Pokke Village
            "Slay the Giaprey!": "pre-req",
            "The Mountain Roughrider": "pre-req",
            "The Shadow in the Mountains": "pre-req",
            "No Go on the Popo": "pre-req",
            "The Unwavering Colossus": "pre-req",

            //Mizutsune/Yukumo Village
            "Bye Bye Jaggia": "pre-req",
            "Arzuros the Azure Beast": "pre-req",
            "Royal Spit Take": "pre-req",
            "A Forest Fracas": "pre-req",
            "The Entrancing Water Dancer": "pre-req",
        };
    }

    overwriteKeyType(keyType, title, questType) {
        if (questType == "Village") {
            if (this.villageKeyTypeOverride.hasOwnProperty(title)) {
                return this.villageKeyTypeOverride[title];
            }
        }

        return keyType;
    }

    getQuest($children, $firstCell, stars, questType) {
        const $ = this.$;

        let keyType = "normal";
        let title = $.trim($children.eq(1).text());
        let monster = $.trim($children.eq(2).text())
        let huntType = $("div", $firstCell).first().text();
        let location = $("a", $firstCell).text();

        if ($(".badge-danger", $firstCell).length > 0) {
            keyType = "urgent";
        }
        if ($(".badge-success", $firstCell).length > 0) {
            keyType = "key";
        }

        keyType = this.overwriteKeyType(keyType, title, questType);

        if (stars > 10) {
            stars = stars - 10;
            stars = "G " + stars;
        }

        return {
            title: title,
            location: location,
            monster: monster,
            questType: questType,
            keyType: keyType,
            huntType: huntType,
            rank: stars
        };
    }

    getQuestsOfStars(stars, questType, $container) {
        const quests = [];
        const $ = this.$;
        const $rows = $("table.table-sm tr", $container);
        console.log($rows.length);
        $rows.each((i, el) => {
            const $children = $("td", $(el));
            const $firstCell = $children.eq(0);


            if ($children.length < 4) {
                return;
            }

            const quest = this.getQuest($children, $firstCell, stars, questType);
            quests.push(quest);
        });

        return quests;
    }

    getQuestsOfType(questType, $container) {
        const quests = {};
        const $ = this.$;

        $(".tab-pane", $container).each((i, el) => {
            const stars = $(el).attr("id").split("-")[1];

            quests[stars] = this.getQuestsOfStars(stars, questType, $(el));
        });

        return quests;
    }

    getQuests() {
        const quests = {};
        const $ = this.$;
        const $questTypes = $("#accordion .card");

        $questTypes.each((i, el) => {
            const $questType = $(el);
            let questType = $(".card-header", $questType).text();

            questType = $.trim(questType);
            quests[questType] = this.getQuestsOfType(questType, $questType);

            console.log("fetching: " + questType);
        });

        return quests;
    }

    flattenQuests(quests) {
        const flattened = [];
        const $ = this.$;

        $.each(quests, function (questType, starList) {
            $.each(starList, function (i, questList) {
                $.each(questList, function (c, quest) {
                    if (quest.questType === "Village") {
                        flattened.push(quest);
                    }
                    if (quest.questType === "Hub") {
                        flattened.push(quest);
                    }
                });
            });
        });

        return flattened;
    }

    parse() {
        const quests = this.getQuests();
        const flatQuests = this.flattenQuests(quests);

        this.writeJson("quests", flatQuests);
    }

    scrape() {
        this.getHtml('quest', (html) => {
            this.setJquery(html);
            this.parse();
        });
    }
}

module.exports = QuestScraper;