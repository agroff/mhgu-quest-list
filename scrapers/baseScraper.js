const fs = require("fs");
const curl = require("curl");
const jsdom = require("jsdom");

class BaseScraper {

    constructor() {
        this.$ = {};
    }

    getUrl(uri) {
        return "https://mhgu.kiranico.com/" + uri;
    }

    getCacheFile(uri) {
        return __dirname + '/../cache/' + uri + '.html';
    }

    getJsonFile(name) {
        return __dirname + '/../json/' + name + '.json';
    }

    regexExtract(regex, string, defaultValue = 0) {
        var match = regex.exec(string);

        if (match && match[1]) {

            if (defaultValue === 0) {
                return parseInt(match[1], 10);
            }

            return match[1];
        }

        return defaultValue;
    }

    writeJson(name, object) {
        const file = this.getJsonFile(name);
        const json = JSON.stringify(object, null, 2);
        fs.writeFileSync(file, json);
    }

    fetchUrl(url, callback) {
        curl.get(url, null, (err, resp, html) => {
            if (!resp || resp.statusCode != 200) {
                console.error("Error while fetching url.");
                callback(false);
                return;
            }

            callback(html);
        });
    }

    getHtml(uri, callback) {

        const file = this.getCacheFile(uri);
        const url = this.getUrl(uri);

        if (fs.existsSync(file)) {
            console.log("File Exists, using cached");
            const html = fs.readFileSync(file);

            callback(html);
            return;
        }

        console.log("Downloading...");
        this.fetchUrl(url, function (html) {

            if (!html) {
                return;
            }

            fs.writeFileSync(file, html);
            callback(html);
        });
    }

    setJquery(html) {
        const {
            JSDOM
        } = jsdom;
        const dom = new JSDOM(html);
        this.$ = (require('jquery'))(dom.window);
    }
}

module.exports = BaseScraper;