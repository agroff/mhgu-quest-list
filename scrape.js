const curl = require("curl");
const jsdom = require("jsdom");
const fs = require("fs");
const url = "https://mhgu.kiranico.com/quest";

let $ = {};


function getQuestsOfStars(stars, questType, $container) {
  const quests = [];
  const $rows = $("table.table-sm tr", $container);

  $rows.each(function(){
    const $children = $("td", $(this));
    const $firstCell = $children.eq(0);

    if($children.length < 4){
      return;
    }

    let keyType = "normal";
    let huntType = $("div", $firstCell).first().text();
    let location = $("a", $firstCell).text();

    if($(".badge-danger", $firstCell).length > 0){
      keyType = "urgent";
    }
    if($(".badge-success", $firstCell).length > 0){
      keyType = "key";
    }

    if(stars > 10){
      stars = stars - 10;
      stars = "G " + stars;
    }

    quests.push({
      title : $.trim($children.eq(1).text()),
      location : location,
      monster : $.trim($children.eq(2).text()),
      questType : questType,
      keyType : keyType,
      huntType : huntType,
      rank : stars
    });

  });

  return quests;
}

function getQuestsOfType(questType, $container) {
  const quests = {};

  $(".tab-pane", $container).each(function () {
    const stars = $(this).attr("id").split("-")[1];

    quests[stars] = getQuestsOfStars(stars, questType, $(this));
  });

  return quests;
}

function getQuests() {
  const quests = {};
  const $questTypes = $("#accordion .card");

  $questTypes.each(function () {
    const $questType = $(this);
    let questType = $(".card-header", $questType).text();

    questType = $.trim(questType);
    quests[questType] = getQuestsOfType(questType, $questType);
    console.log(questType);
  });

  return quests;
}

function writeAsJson(file, object){
  const json = JSON.stringify(object, null, 2);
  fs.writeFileSync(file, json);
}

function writeFlattenedQuests(quests){
  const flattened = [];
  $.each(quests, function(questType, starList){
    $.each(starList, function(i, questList){
      $.each(questList, function(c, quest){
        //console.log(quest);
        if(quest.questType === "Village"){
          flattened.push(quest);
        }
        if(quest.questType === "Hub"){
          flattened.push(quest);
        }
      });
    });
  });

  writeAsJson("quests-flattened.json", flattened);
}

function parseData(html) {
  const { JSDOM } = jsdom;
  const dom = new JSDOM(html);
  $ = (require('jquery'))(dom.window);
  //let's start extracting the data

  //console.log($("#accordion").html());
  const quests = getQuests();

  //console.log(quests);
  writeAsJson("quests.json", quests);
  writeFlattenedQuests(quests);
}

if (fs.existsSync("example.html")) {
  console.log("File Exists...");
  parseData(fs.readFileSync("example.html"));
  return;
}

console.log("Downloading...");
curl.get(url, null, (err, resp, body) => {
  if (resp.statusCode == 200) {
    fs.writeFileSync("example.html", body);
    parseData(body);
  }
  else {
    //some error handling
    console.log("error while fetching url");
  }
});