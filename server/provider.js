const Db = require('./db');

class Provider {



    async getWeaponsTypes(){
        const weaponTypes = [];
        const query = "SELECT DISTINCT wtype FROM weapons ORDER BY wtype"
        await Db.query(query, {}, (i) => {
            weaponTypes.push(i.wtype);
        });

        return weaponTypes;
    }

    async getWeapons(type){
        const query = "SELECT * FROM weapons w INNER JOIN items i on w._id=i._id WHERE w.wtype=$type AND w.attack > $minAttack";
        const parameters = {
            $type: type,
            $minAttack: 0
        };
        const weapons = await Db.query(query, parameters, (item) => {
            if(!item.sharpness){
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