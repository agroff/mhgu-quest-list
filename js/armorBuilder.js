let skillList = {
    75: {},
    71: {},
    70: {},
    35: {},
    5: {}
};
let skillMap = [];
let charms = [];
const selectedTrees = {};

let webWorker = false;

const initialize = async () => {
    startWebWorker();
    bindSelection();
    bindFindButton();
    bindDirectionButtons();
    bindRemove();
    bindAddCharm();
    await getSkills();
    renderAllSkills();

    // $('.selectPicker').selectpicker();
};

const getSkills = async () => {
    return new Promise(function (resolve, reject) {
        $.getJSON('json/skills.json', (data) => {
            for(const i in data){
                skillList[i] = data[i];
                skillMap.push({
                    id: data[i].id,
                    rating: data[i].rating
                });
            }

            skillMap = skillMap.sort((a,b)=>{
                if(a.rating > b.rating) return -1;
                if(a.rating < b.rating) return 1;
            });
            resolve();
        });
    });
};

const renderSkills = () => {
    let html = '';
    let selectHtml = '';
    for (let skill of skillMap) {
        const skillTree = skillList[skill.id];
        html += '<div class="skill-container">' + skillTree.name + '';
        for (let skill of skillTree.skills) {
            let disabledClass = '';
            let selectedClass = '';
            if (selectedTrees[skillTree.id]) {
                disabledClass = ' disabled'
                if (selectedTrees[skillTree.id] === skill.points) {
                    selectedClass = 'selected';
                }
            }
            if(skill.points < 0){
                continue;
            }
            
            html += `
            <a class="skill ${disabledClass}" 
            title="${skill.description}"
            data-points="${skill.points}" 
            data-tree-id="${skillTree.id}" 
            href="javascript:void(0);">
            <i class="fas fa-check-circle ${selectedClass}"></i>
            ${skill.name} <small>(${skill.points})</small>
            </a>
            `;
        }
        html += '</div>';

        selectHtml += `
        <option value="${skillTree.id}">
        ${skillTree.name}
        </option>`;
    }
    $("#skillOne").append(selectHtml);
    $("#skillTwo").append(selectHtml);
    $("#skills").html(html);
};

const renderSelectedSkills = () => {
    let html = '';
    let count = 0;
    const $nextButton = $(".next.btn-primary");
    for (let i in selectedTrees) {
        const points = selectedTrees[i];
        const skillTree = skillList[i];
        let selectedSkill = '';
        for (let skill of skillTree.skills) {
            if (points === skill.points)
                selectedSkill = skill.name
        }
        html += `
        <a href="javascript:void(0);" class="skill" data-tree-id="${i}">
        <i class="fas fa-minus-circle"></i>
        ${selectedSkill}
        </a>
        `;
        count++;
    }
    if(count == 0){
        html = '<div class="empty">Nothing selected...</div>'
        $nextButton.addClass('disabled');
    }
    else {
        $nextButton.removeClass('disabled');
    }
    $("#selectedSkills").html(html);
};

const renderCharms = () => {
    let html = '';
    let count = 0;
    for (let charm of charms) {
        count++;
        let slot = "-"
        if(charm.slots === '1'){
            slot = 'O';
        }
        if(charm.slots === '2'){
            slot = 'OO';
        }
        if(charm.slots === '3'){
            slot = 'OOO';
        }

        let text = `${slot} `;
        for(let skillId in charm.skills){
            const points = charm.skills[skillId];
            console.log(skillList[skillId]);
            const name = skillList[skillId].name;

            text += name + ' +' + points + ' '
        }

        html += `
        <div class="charm">
        ${text}
        </div>
        `
    }
    if(count === 0){
        
        html = 'No Charms Set.';
    }

    $("#currentCharms").html(html);
}

const renderAllSkills = () => {
    renderSkills();
    renderSelectedSkills();
};

const bindSelection = () => {
    $("#skills").on('click', '.skill', function () {
        const $el = $(this);
        const treeId = $el.data('tree-id');
        const points = $el.data('points');
        selectedTrees[treeId] = points;
        renderAllSkills();
    });
};

const bindDirectionButtons = () => {
    $(".next.btn-primary").click(() => {
        $("#steps").attr("class", 'step-two');
        $(".armor-viewport").removeClass('step-one').addClass("step-two");
    });

    $(".back.btn-primary").click(() => {
        $("#steps").attr("class", 'step-one');
        $(".armor-viewport").removeClass('step-two').addClass("step-one");
    });

    $(".next-two.btn-primary").click(() => {
        $("#steps").attr("class", 'step-three');
        $(".armor-viewport").removeClass('step-two').addClass("step-three");
    });

    $(".back-two.btn-primary").click(() => {
        $("#steps").attr("class", 'step-two');
        $(".armor-viewport").removeClass('step-three').addClass("step-two");
    });
};

const bindFindButton = () => {
    $("#findButton").click(() => {
        webWorker.postMessage({
            type: "searchArmor",
            skillTrees: selectedTrees
        });
    });
};

const bindAddCharm = () => {
    $("#addCharm").click(() => {
        const charm = {
            slots: $("#charmSlots").val(),
            skills: {},
        };
        const skillOne = $("#skillOne").val();
        const skillTwo = $("#skillTwo").val();
        const pointsOne = $("#pointsOne").val();
        const pointsTwo = $("#pointsTwo").val();

        if(!charm.slots || !skillOne || !pointsOne){
            alert("Error");
            return;
        }
        charm.skills[skillOne] = pointsOne;
        if(skillTwo && pointsTwo){
            charm.skills[skillTwo] = pointsTwo;
        }

        charms.push(charm);
        $("#skillOne").val('');
        $("#skillTwo").val('');
        $("#pointsOne").val('');
        $("#pointsTwo").val('');
        $("#charmSlots").val('0');

        renderCharms();
    });
};

const bindRemove = () => {
    $("#selectedSkills").on('click', '.skill', function () {
        const $el = $(this);
        const treeId = $el.data('tree-id');
        delete selectedTrees[treeId];
        renderAllSkills();
    });
};

const startWebWorker = () => {
    webWorker = new Worker('js/armorWorker.js');

    webWorker.onmessage = function(e){
        console.log('message', e);
    };
};

initialize();