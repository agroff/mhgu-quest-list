var weapons = [];
var weaponList = [];

var selectedWeapons = [];

var skillList = {};

const damageOperations = [];

function fetchWeapons(type, callback) {
    $.getJSON("json/weapons/" + type + ".json", function (data) {
        callback(data);
    });
}

function fetchWeaponList(callback) {
    $.getJSON("json/weapons.json", function (data) {
        callback(data);
    });
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function weaponOptionHtml(weapon) {
    const name = escapeHtml(weapon.name);
    return `
    <div class="weaponOption" data-name="${name}">
    ${name}
    <span>${weapon.damage} DMG</span>
    </div>
    `;
}

function getSlots(weapon) {
    var html = "";
    for (var i = 0; i < weapon.slots; i++) {
        html += '<span class="slot"></span> ';
    }
    for (var i = 0; i < (3 - weapon.slots); i++) {
        html += '<span class="no-slot"></span> ';
    }
    return html;
}

function removeOneSharpnessLevel(sharp) {
    sharp = Object.assign({}, sharp);
    let lastIndex;
    for (const i in sharp) {
        const value = sharp[i];
        if (value == 0) {
            continue;
        }
        lastIndex = i;
    }

    sharp[lastIndex] = 0;

    return sharp;
}

function getModifiedSharpness(weapon, skills) {
    var sharp = weapon.sharpness.normal;


    $.each(skills, function (i, skill) {
        if (skill.type === 'handicraft') {
            if (skill.level === '1') {
                sharp = weapon.sharpness.sharper;
            }
            if (skill.level === '2') {
                sharp = weapon.sharpness.sharpest;
            }
            if (skill.level === '-1') {
                sharp = removeOneSharpnessLevel(sharp);
            }

        }
    });

    return sharp;
}

function getSharpness(weapon, skills) {
    sharp = getModifiedSharpness(weapon, skills);

    var html = '';
    $.each(sharp, function (color, width) {
        html += '<span class="' + color + '" style="width:' + width + '%"></span>';
    });

    return html;
}

function loadFromHash() {
    var weapons = window.location.hash.substr(1);
    let segments = weapons.split("@");


    if (segments.length < 2) {
        return;
    }

    $("#weaponType").val(segments[0]);
    loadWeapons(segments[0], function () {
        weapons = segments[1].split("|");

        for (weapon of weapons) {
            selectWeapon(decodeURI(weapon));
        }
    });
}

function setHash() {
    let hash = '#' + $("#weaponType").val() + '@';
    for (weapon of selectedWeapons) {
        hash += weapon.name + '|';
    }

    hash = hash.substr(0, hash.length - 1);

    window.location.hash = hash;
}

function getSharpnessModifier(weapon, skills) {
    var lookup = {
        red: 0.5,
        orange: 0.75,
        yellow: 0.85,
        green: 1.05,
        blue: 1.2,
        white: 1.32,
        purple: 1.39
    };
    var sharpness = getModifiedSharpness(weapon, skills);
    var modifier = 0;

    $.each(sharpness, function (color, length) {
        var mod = lookup[color];
        if (length < 2) {
            return;
        }
        if (mod > modifier) {
            modifier = mod;
        }
    });

    return modifier;
}

function getModifiedDamage(weapon, skills, index) {
    // normalized = (rawAttack * sharpnessModifier) * (1.25 * affinity/100) + (elemental / 2)
    var raw = parseInt(weapon.damage, 10);
    const oldSharpness = getSharpnessModifier(weapon, [])
    var sharpness = getSharpnessModifier(weapon, skills);
    var affinity = parseInt(weapon.affinity) / 100;
    // var elemental = weapon.elemental.amount / 5;
    var elemental = 0;

    var critModifier = 0.25;

    if (sharpness != oldSharpness) {

        addOperation(
            index, 'Sharpness Mod', 'sharpness',
            oldSharpness, '-> ' + sharpness, sharpness
        );
    }

    $.each(skills, function (i, skill) {
        if (skill.type === 'critical-up') {
            critModifier = 0.4;
            displayModifier = (1 + critModifier).toFixed(2);
            addOperation(
                index, 'Critical Up', 'critModifier', '1.25',
                '-> ' + displayModifier, displayModifier
            );
        }
    });

    var normalizedAffinity = 1 + (critModifier * affinity);

    // console.log(raw, sharpness, affinity, elemental);
    addOperation(
        index, 'Sharpness Modifier', 'final',
        raw, 'x ' + sharpness, Math.floor(raw * sharpness)
    );

    addOperation(
        index, 'Affinity Modifier', 'final',
        Math.floor(raw * sharpness), 'x ' + normalizedAffinity.toFixed(2),
        Math.floor(raw * sharpness * normalizedAffinity)
    );

    var modified = (raw * sharpness) * normalizedAffinity + elemental;

    return Math.floor(modified);
}

function fixSharpness(sharpString) {
    const map = [
        'red',
        'orange',
        'yellow',
        'green',
        'blue',
        'white',
        'purple',
    ];

    const sharp = sharpString.split('.').reduce((newMap, value, index) => {
        const color = map[index];
        newMap[color] = value * 2;

        return newMap;
    }, {});

    return sharp;
}

function getModifiedWeapon(weapon, skills, index) {
    //make a copy
    const newWeapon = Object.assign({}, weapon);

    $.each(skills, function (i, skill) {
        if (skill.type === 'attack-up') {
            let letter = '';
            let value = 0;
            if (skill.level === '1') {
                letter = 'S';
                value = 10;
            }
            if (skill.level === '2') {
                letter = 'M';
                value = 15;
            }
            if (skill.level === '3') {
                letter = 'L';
                value = 20;
            }
            addOperation(
                index, 'Attack up ' + letter, 'attack', newWeapon.damage,
                '+ ' + value, newWeapon.damage + value
            );
            newWeapon.damage += value;
        }

        if (skill.type === 'tenderizer') {
            let modifier = skill.triggerPercent / 100;
            const oldAffinity = newWeapon.affinity;
            newWeapon.affinity += Math.round(50 * modifier)
            addOperation(
                index, 'Weakness Exploit', 'affinity', oldAffinity,
                '+ 50 * ' + modifier, newWeapon.affinity
            );

        }

        if (skill.type === 'blunt') {
            console.log(weapon);
            // $.each(weapon.sharpness)
            const map = {
                0.5: 1.2,  // red
                0.75: 1.2, //orange
                0.85: 1.2, //yellow
                1.05: 1.1, //green
                1.2: 1,    //blue
                1.32: 1,   //white
                1.39: 1,   //purple
            };
            const sharpMod = getSharpnessModifier(weapon, skills);
            const modifier = map[sharpMod] || 1;

            const oldDamage = newWeapon.damage;
            newWeapon.damage = Math.round(modifier * newWeapon.damage);
            addOperation(
                index, 'Blunt', 'attack', oldDamage,
                '* ' + modifier, newWeapon.damage
            );

        }

        if (skill.type === 'chain-crit') {
            let modifier = skill.triggerPercent / 100;
            const oldAffinity = newWeapon.affinity;
            newWeapon.affinity += Math.round(30 * modifier);

            addOperation(
                index, 'Chain Crit', 'affinity', oldAffinity,
                '+ 30 * ' + modifier, newWeapon.affinity
            );
        }

        if (skill.type === 'expert') {
            const oldAffinity = newWeapon.affinity;
            newWeapon.affinity += skill.level * 10;

            addOperation(
                index, 'Critical Eye +' + skill.level, 'affinity', oldAffinity,
                '+ ' + (skill.level * 10), newWeapon.affinity
            );
        }

        if (skill.type === 'spirit') {
            let modifier = skill.triggerPercent / 100;
            let damageUp = 20;
            let affinityUp = 15;
            if (skill.level === "1") {
                damageUp = 10;
                affinityUp = 10;
            }
            const oldAffinity = newWeapon.affinity;
            const oldDamage = newWeapon.damage;
            newWeapon.damage += Math.round(damageUp * modifier);
            newWeapon.affinity += Math.round(affinityUp * modifier);

            addOperation(
                index, 'Challenger +' + skill.level, 'affinity', oldAffinity,
                '+ ' + affinityUp + ' * ' + modifier.toFixed(2), newWeapon.affinity
            );
            addOperation(
                index, 'Challenger +' + skill.level, 'attack', oldDamage,
                '+ ' + damageUp + ' * ' + modifier.toFixed(2), newWeapon.damage
            );
        }
    });

    if (newWeapon.affinity > 100) {
        const oldAffinity = newWeapon.affinity;
        newWeapon.affinity = 100;

        addOperation(
            index, 'Affinity Capped', 'affinity', oldAffinity,
            '-> 100', newWeapon.affinity
        );
    }

    return newWeapon;
}

function clearOperations(index) {
    damageOperations[index] = [];
}

function addOperation(index, label, modifies, lastValue, operation, newValue) {
    damageOperations[index].push({
        label,
        modifies,
        lastValue,
        operation,
        newValue
    });
}

function initialOperations(weapon, index) {
    clearOperations(index);

    const sharpnessModifier = getSharpnessModifier(weapon, []);

    addOperation(index, 'Base Attack', 'attack', '', '', weapon.damage);
    addOperation(index, 'Base Sharpness', 'sharpness', '', '', sharpnessModifier);
    addOperation(index, 'Default', 'critModifier', '', '', '1.25');
    addOperation(index, 'Base Affinity', 'affinity', '', '', weapon.affinity);
}

function renderWeapon(weapon, index) {


    var $container = $($("#weaponTemplate").html());

    const skills = skillList[index] || {};

    // console.log('rendering ' + weapon.name);

    $container.data("index", index);

    if (weapon.sharpness.normal.split) {
        weapon.sharpness.normal = fixSharpness(weapon.sharpness.normal);
        weapon.sharpness.sharper = fixSharpness(weapon.sharpness.sharper);
        weapon.sharpness.sharpest = fixSharpness(weapon.sharpness.sharpest);
    }

    initialOperations(weapon, index);

    weapon = getModifiedWeapon(weapon, skills, index);

    var elem = weapon.elemental.type + " " + weapon.elemental.amount;

    if (weapon.elemental.amount === 0) {
        elem = "";
    }

    var affinity = weapon.affinity + "%";
    if (weapon.affinity === 0) {
        affinity = "";
    }

    var slots = getSlots(weapon);
    var sharpness = getSharpness(weapon, skills);

    var normalized = getModifiedDamage(weapon, skills, index);
    var damageString = weapon.damage;
    if (elem) {
        // normalized += ' + ' + weapon.elemental.amount + ' Elem.';
    }


    // $("#weapon" + compareId).val(weapon.name);


    $(".weapon-title", $container).text(weapon.name);
    $(".attack-value", $container).text(damageString);
    $(".weapon-damage-normal", $container).text(normalized);
    $(".elem-value", $container).text(elem);
    $(".affinity-value", $container).text(affinity);

    $(".slots-value", $container).html(slots);
    $(".sharpness", $container).html(sharpness);

    $container.show();

    $("#renderedWeapons").append($container);


}

function renderWeapons() {
    $("#renderedWeapons").html("");
    let index = 0;
    for (const weapon of selectedWeapons) {
        renderWeapon(weapon, index);
        index++;
    }
    setHash();
}

function renderSkill($skillContainer, index) {
    const skills = skillList[index];
    if (!skills) {
        return;
    }
    $skillContainer.html('');
    let skillIndex = 0;
    for (const skill of skills) {
        $skillRow = $($("#skill-list").html());
        $skillRow.data('index', skillIndex);


        $skillContainer.append($skillRow);

        $(".skill-select", $skillRow).val(skill.type);
        $(".skill-" + skill.type, $skillRow).show();
        $(".trigger-percent", $skillRow).val(skill.triggerPercent);
        $(".level", $skillRow).val(skill.level);
        skillIndex++;
    }
}

function renderSkills() {
    $('.weapon-skills').each(function () {
        const $skillContainer = $(this);
        const index = getWeaponIndex($skillContainer);
        renderSkill($skillContainer, index);
    });
}

function selectWeapon(name) {
    $.each(weapons, function (i, item) {
        if (item.name === name) {
            selectedWeapons.push(item);
            //renderWeapon(item, compareId);
        }
    });

    $("#weaponOne").val('');
    $(".weaponList").hide();

    renderWeapons();
    renderSkills();
}

function renderResults(value, compareId) {
    var $results = $("#results" + compareId);
    var count = 0;

    value = value.toLowerCase();

    var html = '';
    $.each(weapons, function (i, weapon) {
        if (count > 25) {
            return;
        }
        if (weapon.name.toLowerCase().indexOf(value) > -1) {
            html += weaponOptionHtml(weapon);
            count++;
        }
    });

    if (count == 0) {
        html = '<div class="weaponOption centered>No Matches</div>';
    }

    $results.html(html);
    $results.show();
}

function bindSearch(compareId) {
    $("body").on('keyup', "#weapon" + compareId, function () {
        var value = $(this).val();
        renderResults(value, compareId);
    });

    $("#results" + compareId).on("click", ".weaponOption", function () {
        var name = $(this).attr("data-name");
        selectWeapon(name, compareId);
    });
}

function loadWeapons(type, callback) {
    let cb = callback || function () {};
    fetchWeapons(type, function (result) {
        weapons = result;

        $("#weaponOne").show();

        cb();
    });
}

function getSkill($select) {
    let $container = $select.closest('.skill-row');

    let weaponIndex = getWeaponIndex($container);
    let skillIndex = $container.data("index");

    return skillList[weaponIndex][skillIndex];
}

function getWeaponIndex($element) {
    var $container = $element.closest('.weapon');
    var index = $container.data("index");
    return index;
}

function showCalculationDetails(index) {
    const weapon = selectedWeapons[index];

    const operations = damageOperations[index];

    operations.sort((a, b) => {
        const map = {
            sharpness: 1,
            affinity: 2,
            critModifier: 3,
            attack: 4,
            final: 5,
        };

        return map[a.modifies] < map[b.modifies] ? -1 : 1;
    });

    let html = '<table>';
    let lastModifies = '';
    for (const operation of operations) {
        if (operation.modifies !== lastModifies) {
            html += `
            <tr>
                <td colspan="2" class="table-head">
                    ${operation.modifies}
                </td>
            </tr>`;
        }

        lastModifies = operation.modifies;

        html += `
        <tr>
            <td>&nbsp;&nbsp;</td>
            <td>${operation.label}</td>
            <td>${operation.lastValue}</td>
            <td>${operation.operation}</td>
            <td>= ${operation.newValue}</td>
        </tr>
        `;
    }

    $("#damage-details").html(html);

    $('#modal-title').text(weapon.name);
    $("#modal-container").fadeIn('fast');
}

function calculateDamage() {
    renderWeapons();
    renderSkills();
}

function globalBindings() {

    bindSearch("One");

    $("#renderedWeapons").on('click', '.close-icon', function () {
        var index = getWeaponIndex($(this));
        selectedWeapons.splice(index, 1);
        renderWeapons();
        renderSkills();
    });

    $("#renderedWeapons").on('click', '.red-row a', function () {
        var index = getWeaponIndex($(this));
        showCalculationDetails(index);
    });

    $("#close-modal").click(function () {
        $("#modal-container").hide();
    });

    $("#renderedWeapons").on('click', '.new-skill a', function () {
        var index = getWeaponIndex($(this));
        if (!skillList.hasOwnProperty(index)) {
            skillList[index] = [];
        }

        skillList[index].push({
            type: '',
            triggerPercent: '50',
            level: "1",
        });

        renderSkills();
    });

    $("#renderedWeapons").on('change', '.skill-select', function () {
        let $container = $(this).closest('.skill-row');
        let value = $(this).val();
        let weaponIndex = getWeaponIndex($container);
        let skillIndex = $container.data("index");
        $(".single-skill", $container).hide();
        $(".skill-" + value, $container).show();

        skillList[weaponIndex][skillIndex].type = value;

        //console.log("setting skill " + skillIndex + ' to ' + value);
        //console.log(skillList);
        calculateDamage();
    });

    $("#renderedWeapons").on('change', '.level', function () {
        const skill = getSkill($(this));
        let value = $(this).val();
        skill.level = value;

        calculateDamage();
    });
    $("#renderedWeapons").on('change', '.trigger-percent', function () {
        const skill = getSkill($(this));
        let value = $(this).val();
        skill.triggerPercent = value;

        calculateDamage();
    });
}


fetchWeaponList(function (result) {
    weaponList = result.types;

    $("#weaponOne").hide();

    var html = '<option value="">Select Weapon Type...</option>';
    for (const weapon of weaponList) {
        const weaponValue = weapon.toLowerCase().replace(/[^a-z]+/g, '-');
        const weaponName = weapon.endsWith('s') ? weapon : weapon + 's';
        html += '<option value="' + weaponValue + '">Compare: ' + weaponName + '</option>';
    }

    $("#weaponType").html(html);

    $("#weaponType").change(function () {
        const value = $(this).val();

        if (value !== '') {
            loadWeapons(value);
        } else {
            $("#weaponOne").hide();
        }
    });

    loadFromHash();
});

globalBindings();