//alert("hi");

var typeFilter = "";
var villageRankFilter = "";
var hubRankFilter = "";
var onlyShowKey = false;

function fetchQuests(callback) {
    $.getJSON("json/quests.json", function (data) {
        callback(data);
    });
}

function questToHtml(quest) {
    var huntClass = quest.huntType.toLowerCase();

    return `
    <div class="quest-item">
        <div class="key-type ${quest.keyType}">
            <div class="key-indicator" title="${quest.keyType}"></div>
        </div>
        <div class="quest-title">
            <span class="header">${quest.title}</span>
            <span class="sub-text">${quest.location}</span>
        </div>
        <div class="quest-monster">
            <span class="header ${huntClass}">${quest.huntType}</span>
            <span class="sub-text">${quest.monster}</span>
        </div>
    </div>
    `;
}

function objectToDropdown(options, dropdownId) {
    var html = '';
    $.each(options, function (option, value) {
        html += `<option value="${option}">${value}</option>`;
    });

    $("#" + dropdownId).html(html);
}

function renderDropdowns(quests) {
    var villageRanks = {};
    var hubRanks = {};

    $.each(quests, function (i, quest) {
        if (quest.questType === "Village") {
            villageRanks[quest.rank] = quest.rank + " ★";
        }
        if (quest.questType === "Hub") {
            hubRanks[quest.rank] = quest.rank + " ★";
        }
    });

    objectToDropdown(villageRanks, 'villageRank');
    objectToDropdown(hubRanks, 'hubRank');

}

function saveFilters() {
    localStorage.setItem("typeFilter", typeFilter);
    localStorage.setItem("villageRankFilter", villageRankFilter);
    localStorage.setItem("hubRankFilter", hubRankFilter);
    localStorage.setItem("onlyShowKey", onlyShowKey);
}

function loadFilters() {
    typeFilter = localStorage.getItem("typeFilter") || "";
    villageRankFilter = localStorage.getItem("villageRankFilter") || "";
    hubRankFilter = localStorage.getItem("hubRankFilter") || "";
    onlyShowKey = localStorage.getItem("onlyShowKey") || false;

    if (onlyShowKey === "true") {
        onlyShowKey = true;
    }
    if (onlyShowKey === "false") {
        onlyShowKey = false;
    }

    if (typeFilter !== "") {
        $("#questType").val(typeFilter);
    }
    if (villageRankFilter !== "") {
        $("#villageRank").val(villageRankFilter);
    }
    if (hubRankFilter !== "") {
        $("#hubRank").val(hubRankFilter);
    }

    if (onlyShowKey) {
        $("#onlyKeyQuests").bootstrapToggle('on')
    }
}

function applyFilters() {
    typeFilter = $("#questType").val();
    villageRankFilter = $("#villageRank").val();
    hubRankFilter = $("#hubRank").val();

    onlyShowKey = $("#onlyKeyQuests:checked").length === 1;

    if (typeFilter === "Village") {
        $("#hubRank").hide();
        $("#villageRank").show();
    } else {
        $("#hubRank").show();
        $("#villageRank").hide();
    }

    saveFilters();
}


function renderQuestList(quests) {
    var html = '';

    //Source data has duplicates - We won't display them on the same screen.
    var duplicateLookup = {};
    $.each(quests, function (i, quest) {
        const isKeyQuest = quest.keyType === 'key' || quest.keyType === 'pre-req';
        if (quest.questType !== typeFilter) {
            return;
        }
        if (typeFilter === "Village" && quest.rank !== villageRankFilter) {
            return;
        }
        if (typeFilter === "Hub" && quest.rank !== hubRankFilter) {
            return;
        }
        if (onlyShowKey && !isKeyQuest) {
            return;
        }
        if (duplicateLookup.hasOwnProperty(quest.title)) {
            return;
        }

        duplicateLookup[quest.title] = quest.title;

        html += questToHtml(quest);
    });

    $("#quest-list").html(html);
}

function bindInterface(quests) {
    $("select, #onlyKeyQuests").change(function () {
        applyFilters();
        renderQuestList(quests);
    });
}

fetchQuests(function (quests) {
    renderDropdowns(quests);
    loadFilters();
    bindInterface(quests);
    applyFilters();
    renderQuestList(quests);
});