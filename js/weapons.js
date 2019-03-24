var weapons = [];
var weaponList = [];

var selectedWeapons = [];

var skillList = {};

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

function weaponOptionHtml(weapon) {
    return `
    <div class="weaponOption" data-name="${weapon.name}">
    ${weapon.name}
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

function getModifiedSharpness(weapon, skills){
    var sharp = weapon.sharpness.normal;

    $.each(skills, function(i, skill) {
        if(skill.type === 'handicraft'){
            if(skill.level === '1'){
                sharp = weapon.sharpness.sharper;
            }
            if(skill.level === '2'){
                sharp = weapon.sharpness.sharpest;
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


    if(segments.length < 2){
        return;
    }

    $("#weaponType").val(segments[0]);
    loadWeapons(segments[0], function(){
        weapons = segments[1].split("|");

        for(weapon of weapons){
            selectWeapon(decodeURI(weapon));
        }
    });
}

function setHash() {
    let hash = '#' + $("#weaponType").val() + '@';
    for(weapon of selectedWeapons){
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
        purple: 0.39
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

function getModifiedDamage(weapon, skills) {
    // normalized = (rawAttack * sharpnessModifier) * (1.25 * affinity/100) + (elemental / 2)
    var raw = parseInt(weapon.damage, 10);
    var sharpness = getSharpnessModifier(weapon, skills);
    var affinity = parseInt(weapon.affinity) / 100;
    // var elemental = weapon.elemental.amount / 5;
    var elemental = 0;

    var critModifier = 0.25;

    $.each(skills, function(i, skill) {
        if(skill.type === 'critical-up'){
            critModifier = 0.4;
        }
    });

    var normalizedAffinity = 1 + (critModifier * affinity);

    // console.log(raw, sharpness, affinity, elemental);

    var modified = (raw * sharpness) * normalizedAffinity + elemental;

    return Math.floor(modified);
}

function fixSharpness(sharpString){
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

function getModifiedWeapon(weapon, skills){
    //make a copy
    const newWeapon = Object.assign({}, weapon);

    $.each(skills, function(i, skill) {
        if(skill.type === 'attack-up'){
            if(skill.level === '1'){
                newWeapon.damage += 10;
            }
            if(skill.level === '2'){
                newWeapon.damage += 15;
            }
            if(skill.level === '3'){
                newWeapon.damage += 20;
            }
        }

        if(skill.type === 'tenderizer'){
            let modifier = skill.triggerPercent  / 100;
            newWeapon.affinity +=  Math.round(50 * modifier)
        }

        if(skill.type === 'expert'){
            newWeapon.affinity +=  skill.level * 10;
        }

        if(skill.type === 'spirit'){
            let modifier = skill.triggerPercent  / 100;
            let damageUp = 20;
            let affinityUp = 15;
            if(skill.level === "1"){
                damageUp = 10;
                affinityUp = 10;
            }
            newWeapon.damage += Math.round(damageUp * modifier);
            newWeapon.affinity += Math.round(affinityUp * modifier);
        }
    });

    return newWeapon;
}

function renderWeapon(weapon, index) {
    var $container = $($("#weaponTemplate").html());

    const skills = skillList[index] || {};

    console.log('rendering ' + weapon.name);

    $container.data("index", index);

    if(weapon.sharpness.normal.split){
        weapon.sharpness.normal = fixSharpness(weapon.sharpness.normal);
        weapon.sharpness.sharper = fixSharpness(weapon.sharpness.sharper);
        weapon.sharpness.sharpest = fixSharpness(weapon.sharpness.sharpest);
    }

    weapon = getModifiedWeapon(weapon, skills);

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

    var normalized = getModifiedDamage(weapon, skills);
    var damageString = weapon.damage;


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
    for(const weapon of selectedWeapons){
        renderWeapon(weapon, index);
        index++;
    }
    setHash();
}
function renderSkill($skillContainer, index){
    const skills = skillList[index];
    if(!skills){
        return;
    }
    $skillContainer.html('');
    let skillIndex = 0;
    for(const skill of skills){
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
function renderSkills(){
    $('.weapon-skills').each(function(){
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
    let cb = callback || function(){};
    fetchWeapons(type, function (result) {
        weapons = result;

        bindSearch("One");
        $("#weaponOne").show();

        cb();
    });
}

function getSkill($select){
    let $container = $select.closest('.skill-row');
    
    let weaponIndex = getWeaponIndex($container);
    let skillIndex = $container.data("index");

    return skillList[weaponIndex][skillIndex];
}

function getWeaponIndex($element){
    var $container = $element.closest('.weapon');
    var index = $container.data("index");
    return index;
}

function calculateDamage(){
    renderWeapons();
    renderSkills();
}

function globalBindings() {
    $("#renderedWeapons").on('click', '.close-icon', function(){
        var index = getWeaponIndex($(this));
        selectedWeapons.splice(index,1);
        renderWeapons();
    });

    $("#renderedWeapons").on('click', '.new-skill a', function(){
        var index = getWeaponIndex($(this));
        if(!skillList.hasOwnProperty(index)){
            skillList[index] = [];
        }

        skillList[index].push({
            type:'',
            triggerPercent: '50',
            level: "1",
        });

        renderSkills();
    });

    $("#renderedWeapons").on('change', '.skill-select', function(){
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

    $("#renderedWeapons").on('change', '.level', function(){
        const skill = getSkill($(this));
        let value = $(this).val();
        skill.level = value;

        calculateDamage();
    });
    $("#renderedWeapons").on('change', '.trigger-percent', function(){
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
        const weaponValue = weapon.toLowerCase().replace(/[^a-z]+/, '-');
        const weaponName = weapon.endsWith('s') ? weapon : weapon + 's';
        html += '<option value="' + weaponValue + '">Compare: ' + weaponName + '</option>';
    }

    $("#weaponType").html(html);

    $("#weaponType").change(function () {
        const value = $(this).val();

        if(value !== ''){
            loadWeapons(value);    
        }
        else {
            $("#weaponOne").hide();
        }
    });

    loadFromHash();
});

globalBindings();