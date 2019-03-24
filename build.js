const watch = require('node-watch');
const fs = require('fs');

const watchOptions = {
    recursive: true
};

const buildAll = () => {
    const files = fs.readdirSync('pages');
    files.forEach((file) => {
        buildPage('pages/' + file);
    });
};

const startWatch = () => {
    console.log('Watching files...');

    watch('pages', watchOptions, function (evt, name) {
        console.log('%s changed.', name);
        buildPage(name);
    });

    watch('partials', watchOptions, function (evt, name) {
        console.log('%s changed.', name);
        buildAll();
    });
};

const watchEnabled = () => {
    let enabled = true;

    process.argv.forEach((val) => {
        if(val === '--no-watch'){
            enabled = false;
        }
    });

    return enabled;
};

const normalizePageName = (name) => {
    let newName = name.split('/').pop();
    newName = newName.replace(/\.(?:html|htm)$/, '');
    return newName;
};

const getFile = (file) => {
    return fs.readFileSync(file, 'utf8');
};

const logError = (message) => {
    console.log('\x1b[31m%s\x1b[0m', message);
};

const parseVariables = (variables) => {
    let matches = {};
    const re = /@([\w]+)\s*=\s*([^@]+)/g;
    while(match = re.exec(variables)){
        matches[match[1]] = match[2].trim();
    }
    return matches;
};

const substituteVariables = (contents, variableList) => {
    variableList = parseVariables(variableList);
    contents = contents.replace(/{{\s*@([\w]+)\s*(?:\|([^}]+))?}}/igm, (all, variable, defaultValue) => {
        return variableList[variable] || defaultValue || '';
    });

    return contents;
};

const buildPage = (name) => {
    console.log("Writing file: " + name);
    const baseName = normalizePageName(name);
    const contents = getFile(name);
    const newFile = contents.replace(/{{\s*include:\s*([^\s]+)\s*(@[^}]+)?\s*}}/igm, (all, file, variables) => {

        let replacement = '<!-- BEGIN AUTO INCLUDE: `' + file + '` -->\n';
        try {
            replacement += getFile(file) + '\n';
            replacement = substituteVariables(replacement, variables);
        } catch (e) {
            logError('ERROR: Could not include file `' + file + '`');
            replacement += '<!-- ERROR: Could not load file -->\n';
        }
        replacement += '<!-- END AUTO INCLUDE: `' + file + '` -->\n';

        return replacement;
    });

    fs.writeFileSync(baseName + '.html', newFile);
};

buildAll();

if(watchEnabled()){
    startWatch();
}