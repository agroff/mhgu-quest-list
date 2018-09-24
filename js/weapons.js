var weapons = [];

selectedOne = "";
selectedTwo = "";


function fetchWeapons(callback) {
    $.getJSON("json/hammer.json", function (data) {
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

function getSharpness(weapon) {
    var sharp = weapon.sharpness.normal;
    var html = '';
    $.each(sharp, function (color, width) {
        html += '<span class="' + color + '" style="width:' + width + '%"></span>';
    });

    return html;
}

function loadFromHash() {
    var weapons = window.location.hash.substr(1);
    weapons = weapons.split("|");

    var one = decodeURI(weapons[0]);
    var two = decodeURI(weapons[1]);

    if (one.length > 2) {
        selectWeapon(one, "One");
    }
    if (two.length > 2) {
        selectWeapon(two, "Two");
    }
}

function setHash() {
    window.location.hash = '#' + selectedOne + '|' + selectedTwo;
}

function renderWeapon(weapon, compareId) {
    var $container = $("#weapon" + compareId + "Box");

    var elem = weapon.elemental.type + " " + weapon.elemental.amount;

    if (weapon.elemental.amount === 0) {
        elem = "";
    }

    var affinity = weapon.affinity + "%";
    if (weapon.affinity === 0) {
        affinity = "";
    }

    var slots = getSlots(weapon);
    var sharpness = getSharpness(weapon);


    $("#weapon" + compareId).val(weapon.name);
    $(".weaponList").hide();

    $(".weapon-title", $container).text(weapon.name);
    $(".attack-value", $container).text(weapon.damage);
    $(".elem-value", $container).text(elem);
    $(".affinity-value", $container).text(affinity);

    $(".slots-value", $container).html(slots);
    $(".sharpness", $container).html(sharpness);

    $container.show();

    if (compareId === "One") {
        selectedOne = weapon.name;
    } else {
        selectedTwo = weapon.name;
    }

    setHash();
}

function selectWeapon(name, compareId) {
    $.each(weapons, function (i, item) {
        if (item.name === name) {
            renderWeapon(item, compareId);
        }
    });
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
    $("#weapon" + compareId).keyup(function () {
        var value = $(this).val();
        renderResults(value, compareId);
    });

    $("#results" + compareId).on("click", ".weaponOption", function () {
        var name = $(this).attr("data-name");
        selectWeapon(name, compareId);
    });
}

fetchWeapons(function (result) {
    weapons = result;

    bindSearch("One");
    bindSearch("Two");

    loadFromHash();
});