var sqlite3 = require('sqlite3').verbose();



class Db {

    constructor() {
        this.db = new sqlite3.Database('assets/mhgu.db');
    }

    async query(query, parameters = {}, translator = (i) => {return i}) {
        const promise = new Promise((resolve, reject) => {
            const results = [];

            this.db.each(query, parameters, function (err, row) {
                results.push(translator(row));
            }, (error, count) => {
                if(error){
                    console.log(error);
                    reject(error);
                }
                resolve(results);
            });
        });

        return promise;
    }



}

module.exports = new Db();