class ArmorSet {
    defense = 0;

    slots = 0;

    skills = {};

    pieces = {};

    names = [];

    constructor(head, arms, body, waist, legs) {
        this.add(head);
        this.add(arms);
        this.add(body);
        this.add(waist);
        this.add(legs);
    }

    add(armor) {
        const piece = armor.sub_type.toLowerCase();

        if (this.pieces.hasOwnProperty(piece)) {
            throw new Error("Duplicate piece added to armor set.");
        }

        this.pieces[piece] = armor._id;
        this.names.push(armor.name);

        this.defense += armor.max_defense;

        for (let skill of armor.skills) {
            const skillId = skill.skill_tree;
            if (!this.skills[skillId]) {
                this.skills[skillId] = 0;
            }
            this.skills[skillId] += (skill.points * 1);
        }
    }

    compare(skillRequirements) {

        for (let skillId in skillRequirements) {
            const pointsNeeded = skillRequirements[skillId];
            const availablePoints = this.skills[skillId] || 0;

            if (availablePoints < pointsNeeded) {
                return false;
            }
        }

        return true;
    }

    log() {
        console.log(this.defense + ' def | ' + this.names.join(','));
        let str = ' -- '
        for(let id in this.skills){
            str += 'SkillId ' + id + '; Points: ' + this.skills[id];
        }

        console.log(str);
    }
}

class ArmorWorker {

    matches = [];

    armor = {
        head: [],
        arms: [],
        body: [],
        waist: [],
        legs: [],
    };

    armorTypes = [
        'head', 'arms', 'body', 'waist', 'legs',
    ];

    async getJson(url) {
        return new Promise((resolve, reject) => {
            const xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
                    if (xmlhttp.status == 200) {
                        const text = xmlhttp.responseText;
                        try {
                            const obj = JSON.parse(text);
                            if (obj) {
                                resolve(obj);
                            } else {
                                reject("Invalid JSON from resource: " + url);
                            }
                        } catch (e) {
                            //reject("Invalid JSON from resource: " + url);
                            reject(e.message);
                        }
                    } else if (xmlhttp.status == 400) {
                        reject('Could not find resource: ' + url);
                    } else {
                        reject('Error fetching resource: ' + url);
                    }
                }
            };

            xmlhttp.open("GET", url, true);
            xmlhttp.send();
        });
    }

    async loadArmor(type) {
        const armor = await this.getJson('../json/armor/' + type + '-light.json');
        // console.log(armor)
        return armor;
    }

    async loadAllArmor() {
        for (let type of this.armorTypes) {
            const result = await this.loadArmor(type);
            this.armor[type] = result;
        }
    }

    getFilteredArmor(skillIds) {
        const filter = (item) => {
            for (let skill of item.skills) {
                if (skillIds.includes(skill.skill_tree)) {
                    return true;
                }
            }

            return false;
        };

        const getValue = (item) => {
            let value = 0;
            for (let skill of item.skills) {
                if (skillIds.includes(skill.skill_tree)) {
                    const currentValue = parseInt(skill.points);
                    if (currentValue > value) {
                        value = currentValue;
                    }
                }
            }

            return value;
        };

        const sorter = (a, b) => {
            let aVal = getValue(a);
            let bVal = getValue(b);
            if (aVal > bVal) return -1;
            if (aVal < bVal) return 1;
            if (a.max_defense > b.max_defense) return -1;
            if (a.max_defense < b.max_defense) return 1;
        };

        return {
            head: this.armor.head.filter(filter).sort(sorter),
            arms: this.armor.arms.filter(filter).sort(sorter),
            body: this.armor.body.filter(filter).sort(sorter),
            waist: this.armor.waist.filter(filter).sort(sorter),
            legs: this.armor.legs.filter(filter).sort(sorter),
        };
    }

    calculateSet(skillTrees, head, arms, body, waist, legs) {
        const set = new ArmorSet(head, arms, body, waist, legs);

        const isMatch = set.compare(skillTrees);

        if (isMatch) {
            this.matches.push(set);
        }

        return this.matches.length;
    }

    searchFinished() {

        this.matches.sort((a, b) => {
            if(a.defense > b.defense) return -1;
            if(a.defense < b.defense) return 1;
        });

        for (let match of this.matches) {
            match.log();
        }
    }

    searchArmor(skillTrees) {
        const skillIds = Object.keys(skillTrees);
        const armor = this.getFilteredArmor(skillIds);

        console.log("searching for skills: ", skillTrees);

        //this.generateIndex


        for (const head of armor.head) {
            console.log(head.name);
            for (const arms of armor.arms) {
                console.log('searching sets with ' + arms.name);
                for (const body of armor.body) {
                    for (const waist of armor.waist) {
                        for (const legs of armor.legs) {
                            const totalMatches = this.calculateSet(skillTrees, head, arms, body, waist, legs);

                            if (totalMatches > 100) {
                                this.searchFinished();
                                return;
                            }
                        }
                    }
                }
            }
        }
        this.searchFinished();
    }

    handleMessage(type, message) {
        switch (type) {
            case 'searchArmor':
                this.searchArmor(message.skillTrees);
                break;
            default:
                console.log('Unknown Message', type, message);
        }
    }

    listen(self) {
        self.onmessage = (e) => {
            console.log("got message", e);
            const type = e.data.type;
            delete e.data.type;
            this.handleMessage(type, e.data);
        }

        this.loadAllArmor();
    }
}


const worker = new ArmorWorker();

worker.listen(this);