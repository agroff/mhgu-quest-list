const Db = require('./db');
const skillMeta = require('../json/skillMeta.json');

class Provider {

    getSkillPopularity(skill) {

    }

    async getSkills() {
        
        const skills = {};
        const query = `
        SELECT 
            skills._id, 
            skills.skill_tree_id,
            skill_trees.name AS skill_tree_name,
            skills.required_skill_tree_points,
            skills.name, 
            skills.description
        FROM skills 
        INNER JOIN skill_trees ON skills.skill_tree_id=skill_trees._id`;

        await Db.query(query, {}, (i) => {
            const parentId = i.skill_tree_id;
            if (!skills[parentId]) {
                const key = i.skill_tree_name.toLowerCase().replace(/[^a-z]/g, '');
                const meta = skillMeta[key] || {
                    category: 'Misc',
                    rating: 1,
                };

                skills[parentId] = {
                    id: i.skill_tree_id,
                    name: i.skill_tree_name,
                    category: meta.category,
                    rating: meta.rating,
                    popularity: this.getSkillPopularity(i.skill_tree_name),
                    skills: []
                };
            }

            skills[parentId].skills.push({
                name: i.name,
                description: i.description,
                points: i.required_skill_tree_points,
            });
        });

        return skills;
    }

    async getArmor(type, full = true){
        const skillList = await this.getSkills();
        // const armor = [];
        const query = `
        SELECT
        a.*, i.*,
        group_concat(ist.point_value) AS point_values,
		group_concat(ist.skill_tree_id) AS skill_trees
        FROM armor a
        INNER JOIN items i
            ON a._id=i._id
        INNER JOIN item_to_skill_tree ist
            ON ist.item_id=a._id
        WHERE i.sub_type='${type}'
        GROUP BY a._id
        `;

        const armor = await Db.query(query, {}, (i) => {
            const values = i.point_values.split(',');
            const skillTrees = i.skill_trees.split(',');

            const skills = [];
            for(let i in values){
                const skillData = skillList[skillTrees[i]] || {};
                const skill = {
                    name: skillData.name || '',
                    points: values[i],
                    skill_tree: skillTrees[i]
                }

                if(full === false){
                    delete skill.name;
                }
                skills.push(skill);
            }
            
            i.skills = skills;

            // weaponTypes.push(i.wtype);
            const languages = [ 'de', 'fr', 'es', 'it', 'ja'];
            for(const lang of languages){
                delete i['name_' + lang];
                delete i['description_' + lang];
            }
            delete i.buy;
            delete i.sell;
            delete i.description;
            delete i.icon_name;
            delete i.icon_color;
            delete i.account;
            delete i.carry_capacity;
            delete i.point_values;
            delete i.skill_trees;

            if(full === false){
                return {
                    _id: i._id,
                    name: i.name,
                    num_slots: i.num_slots,
                    max_defense: i.max_defense,
                    sub_type: i.sub_type,
                    skills: skills,
                }
            }


            return i;
        });

        return armor;
    }

    async getWeaponsTypes() {
        const weaponTypes = [];
        const query = "SELECT DISTINCT wtype FROM weapons ORDER BY wtype"
        await Db.query(query, {}, (i) => {
            weaponTypes.push(i.wtype);
        });

        return weaponTypes;
    }

    async getDecorations() {
        const query = `
        SELECT 
            *,
            group_concat(ist.point_value) AS point_values,
		    group_concat(ist.skill_tree_id) AS skill_trees 
        FROM decorations d 
        INNER JOIN items i 
            ON d._id=i._id 
        INNER JOIN item_to_skill_tree ist 
            ON d._id=ist.item_id
        GROUP BY d._id`;

        return await Db.query(query, {}, (i) => {
            /*
            SAMPLE: 
            _id: 14087,
            num_slots: 1,
            name: "Antidote Jwl 1",
            name_de: "GegengiftJwl1",
            name_fr: "Joy Poison 1",
            name_es: "J. antÃ­doto 1",
            name_it: "G veleno 1",
            name_ja: "",
            type: "Decoration",
            sub_type: "",
            rarity: 4,
            carry_capacity: 99,
            buy: 400,
            sell: 40,
            description: "A Decoration that boosts Poison skills.",
            description_de: "Dekoration. Steigert die Gift-FÃ¤higkeit.",
            description_fr: "Augmente les talents Poison.",
            description_es: "Adorno que bonifica la habilidad de veneno.",
            description_it: "Decorazione che aumenta le abilitÃ  di tipo veleno.",
            description_ja: "",
            icon_name: "icon_jewel",
            icon_color: 5,
            account: 0,
            item_id: 2638,
            skill_tree_id: 1,
            point_value: 1,
            point_values: "1,-1",
            skill_trees: "1,4"
            */
            const result = {
                _id: i._id,
                num_slots: i.num_slots,
                name: i.name,
                description: i.description,
                skills: {},
            };

            const skills = i.skill_trees.split(',');
            const points = i.point_values.split(',');

            let c = 0;
            for(let skillId of skills){
                result.skills[skillId] = points[c];
                c++;
            }

            return result;
        });
    }

    async getWeapons(type) {
        const query = "SELECT * FROM weapons w INNER JOIN items i on w._id=i._id WHERE w.wtype=$type AND w.attack > $minAttack";
        const parameters = {
            $type: type,
            $minAttack: 0
        };
        const weapons = await Db.query(query, parameters, (item) => {
            if (!item.sharpness) {
                item.sharpness = '   ';
                //console.log(item);
            }
            const sharpness = item.sharpness.split(" ");
            return {
                id: item._id,
                parentId: item.parent_id,
                familyId: item.family,
                type: item.wtype.toLowerCase(),
                name: item.name,
                damage: item.attack,
                affinity: item.affinity * 1,
                slots: item.num_slots,
                rarity: item.rarity,
                defense: item.defense,
                elemental: {
                    type: item.element,
                    amount: item.element_attack
                },
                sharpness: {
                    normal: sharpness[0],
                    sharper: sharpness[1],
                    sharpest: sharpness[2],
                }

            }
        });

        return weapons;
    }
}

module.exports = Provider;