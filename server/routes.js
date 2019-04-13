const Provider = require('./provider');
const fs = require("fs");

const sample = {
    _id: 203019,
    parent_id: 203018,
    wtype: "Hammer",
    creation_cost: 0,
    upgrade_cost: 22000,
    attack: 350,
    max_attack: 0,
    element: "",
    element_attack: 0,
    element_2: "",
    element_2_attack: 0,
    awaken: "",
    awaken_attack: 0,
    defense: 0,
    sharpness: "8.8.11.3.5.0.0 8.8.11.3.7.0.0 8.8.11.3.7.1.2",
    affinity: "0",
    horn_notes: null,
    shelling_type: null,
    phial: null,
    charges: null,
    coatings: null,
    recoil: null,
    reload_speed: null,
    rapid_fire: null,
    deviation: null,
    ammo: null,
    special_ammo: null,
    num_slots: 2,
    tree_depth: 0,
    final: 1,
    family: 793,
    name: "Bone Crusher 11",
    name_de: "Knochenkracher 11",
    name_fr: "Concasseur en os 11",
    name_es: "Moledor de hueso 11",
    name_it: "Frantuma ossa 11",
    name_ja: "",
    type: "Weapon",
    sub_type: "Hammer",
    rarity: 1,
    carry_capacity: 0,
    buy: 0,
    sell: 0,
    description: "== Ultimate Form == The coveted Ultimate Form of the Bone Hammer.",
    description_de: "- Perfekte Form - Die hÃ¶chste Entwicklungsstufe des Knochenhammers.",
    description_fr: "== Forme ultime == La forme ultime et convoitÃ©e de l'arme : Marteau en os.",
    description_es: "Forma perfecta Martillo de hueso que se ha refinado al mÃ¡ximo.",
    description_it: "Forma superiore L'ambita forma superiore del martello d'osso.",
    description_ja: "",
    icon_name: "icon_hammer",
    icon_color: 0,
    account: 0
}

const provider = new Provider();
const utils = {
    writeJson: (file, data) => {
        const path = __dirname + '/../json/' + file + '.json';
        const json = JSON.stringify(data, null, 2);

        fs.writeFileSync(path, json);
    }
};

const routes = {
    weapons: async (request, response) => {
        const weaponTypes = await provider.getWeaponsTypes();

        utils.writeJson('weapons', {types: weaponTypes});

        for(const type of weaponTypes){
            const file = type.replace(/[\s_]+/g, '-').toLowerCase();
            console.log('fetching ' + file);
            const weapons = await provider.getWeapons(type);

            utils.writeJson('weapons/'+file, weapons);
        }

        response.end(JSON.stringify(weaponTypes));
        return;
    },

    skills: async (request, response) => {
        const skills = await provider.getSkills();

        utils.writeJson('skills', skills);
        response.end(JSON.stringify(skills));
    },

    armor: async (request, response) => {
        const types = [
            'Head', 'Body', 'Arms', 'Waist', 'Legs'
        ];
        const counts = {};
        for(let type of types){
            const armor = await provider.getArmor(type);
            const light = await provider.getArmor(type, false);
            const name = type.toLowerCase();
            counts[name] = light.length;
            utils.writeJson('armor/'+name, armor);
            utils.writeJson('armor/'+name + '-light', light);
        }


        //utils.writeJson('', armor){};
        response.end(JSON.stringify({success:true, counts}));
    },
};

module.exports = routes;