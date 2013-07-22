var qs = require('querystring');
var http = require('http');
var fs = require('fs');

http.createServer(function (request, response) {
for(var key in Object.keys(require.cache)) {
delete require.cache[key];
}

    if (request.method == 'POST') {
        var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {

            var POST = body;// qs.parse(body);
            // use POST

			// Copy old data file backup.
			var dataFile = "data\\data.json.txt";
			if (fs.existsSync(dataFile)) {
				var ticks = ((new Date().getTime() * 10000) + 621355968000000000);
				var newName = "data\\data_" + ticks + ".json.txt";
				fs.renameSync(dataFile, newName)
			}
			
			fs.writeFile(dataFile, POST, function (err) {
				if (err)
					throw err;
			  
				response.writeHead(200, {'Content-Type': 'text/html'});
				response.end('I\'m responding! ' + POST + ' [helloworld sample; iisnode version is ' + process.env.IISNODE_VERSION + ', node version is ' + process.version + ']');
			});
			
		
        });
    } else {
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.end('Hello, world this is a the original updated save script! [helloworld sample; iisnode version is ' + process.env.IISNODE_VERSION + ', node version is ' + process.version + ']');
	}
}).listen(process.env.PORT);  