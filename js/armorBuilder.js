let skillList = {
    75: {},
    71: {},
    70: {},
    35: {},
    5: {}
};
const selectedTrees = {};

let webWorker = false;

const initialize = async () => {
    startWebWorker();
    bindSelection();
    bindFindButton();
    bindRemove();
    await getSkills();
    renderSkills();
};

const getSkills = async () => {
    return new Promise(function (resolve, reject) {
        $.getJSON('json/skills.json', (data) => {
            for(const i in data){
                skillList[i] = data[i];
            }
            
            resolve();
        });
    });
};

const renderSkills = () => {
    let html = '';
    for (let i in skillList) {
        const skillTree = skillList[i];
        html += '<br>' + skillTree.name + '<br>';
        for (let skill of skillTree.skills) {
            let disabledClass = '';
            let selectedClass = '';
            if (selectedTrees[skillTree.id]) {
                disabledClass = ' disabled'
                if (selectedTrees[skillTree.id] === skill.points) {
                    selectedClass = 'selected';
                }
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
            <br>
            `;
        }

    }
    $("#skills").html(html);
};

const renderSelectedSkills = () => {
    let html = '';
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
        ${selectedSkill}
        </a>
        <br>
        `;
    }
    $("#selectedSkills").html(html);
};

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

const bindFindButton = () => {
    $("#findButton").click(() => {
        webWorker.postMessage({
            type: "searchArmor",
            skillTrees: selectedTrees
        });
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