const http = require('http');
const port = 3000;
const routes = require('./server/routes.js');
const Db = require('./server/db');

const requestHandler = (request, response) => {
    const url = request.url;

    console.log("Request: " + url);

    if(url.startsWith('/api/')){
        const route = url.replace('/api/', '');
        if(routes.hasOwnProperty(route)){
            try{
                const result = routes[route](request, response);
                result.then(() => {
                    response.end(JSON.stringify(result));
                });
            }
            catch(e){
                response.end("Error: " + e.message);
            }

            return;
        }
    }

    response.end("Could not find URL: " + url);
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${port}`)
})

process.on('SIGINT', () => {
    Db.db.close();
    server.close();
});