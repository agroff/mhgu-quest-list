const BaseScraper = require("./baseScraper");

class WeaponScraper extends BaseScraper {
    constructor() {
        super();
    }

    getSlots($cells) {
        const value = this.$.trim($cells.eq(4).text());
        return (value.match(/◯/g) || []).length;
    }

    getDefense(modifiers) {
        return this.regexExtract(/Def\s*\+\s*(\d+)/, modifiers);
    }

    getElemental(modifiers) {
        const amount = this.regexExtract(/[a-zA-Z]{3}\s+(\d+)/, modifiers);
        const type = this.regexExtract(/([a-zA-Z]{3})\s+\d+/, modifiers, "");
        return {
            amount: amount,
            type: type
        };
    }

    getAffinity(modifiers) {
        return this.regexExtract(/([-+]\d+)%/, modifiers);
    }

    parseSharpnessBar($bar) {
        const $ = this.$;
        const sharpness = {};

        $("span", $bar).each((i, el) => {
            const $color = $(el);
            const color = $color.attr('class');
            const style = $color.attr('style');
            //console.log($color.html());
            const size = this.regexExtract(/(\d+)px/, style);

            sharpness[color] = size;
        });

        return sharpness;
    }

    getSharpness($cell) {
        const $ = this.$;
        const sharpness = {}
        $(".sharpness-bar", $cell).each((i, el) => {
            let key = "normal";
            if (i === 1) {
                key = "sharper";
            }
            if (i === 2) {
                key = "sharpest";
            }

            sharpness[key] = this.parseSharpnessBar($(el));
        });

        return sharpness;
    }

    getWeapons(weaponType) {
        const $ = this.$;

        const weapons = [];

        $(".table-responsive table tr").each((i, el) => {
            const $children = $("td", el);

            if ($children.length < 2) {
                return;
            }
            const modifiers = $.trim($children.eq(2).text());

            let weapon = {
                type: weaponType,
                name: $children.eq(0).text(),
                damage: $children.eq(1).text(),
                affinity: this.getAffinity(modifiers),
                slots: this.getSlots($children),
                rare: $.trim($children.eq(5).text()),
                sharpness: this.getSharpness($children.eq(3)),
                defense: this.getDefense(modifiers),
                elemental: this.getElemental(modifiers)
            };

            weapons.push(weapon);
        });

        return weapons;
    }

    parse(weapon) {
        const weapons = this.getWeapons(weapon);

        this.writeJson(weapon, weapons);
    }

    scrape(weapon) {
        this.getHtml(weapon, (html) => {
            this.setJquery(html);
            this.parse(weapon);
        });
    }
}

module.exports = WeaponScraper;