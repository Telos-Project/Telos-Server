var serverUtils = require("./serverUtils.js");
var fs = require("fs");
var http = require("http");
var https = require("https");
var busNet = use("bus-net");

var telosServer = {
	process: ((request, response) => {

		serverUtils.processRequest(request, "http", (data) => {

			(new Promise((resolve, reject) => {

				let results = busNet.call(data);
				let responses = [];

				results.forEach(item => {

					if(item instanceof Promise) {

						item.then((result => {

							responses.push(result);

							if(responses.length == results.length)
								resolve(responses);
						}));
					}
					
					else
						responses.push(item);

					if(responses.length == results.length)
						resolve(responses);
				});
			})).then((responses) => {

				let status = 200;

				let headers = {
					'Content-Type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE'
				};

				let body = [];
				let file = false;

				let max = -Infinity;

				responses.filter(item => item != null).forEach(item => {

					item.priority = item.priority != null ? item.priority : 0;

					if(item.priority > max)
						max = item.priority;
				});

				responses.filter(
					item => {

						if(item == null)
							return

						if(item.priority != max)
							return false;

						delete item.priority;

						if(typeof item == "object") {

							if(item.file != null) {
								
								if(item.file)
									file = true;

								delete item.file;
							}
						}
						
						return serverUtils.isHTTPJSON(item);
					}
				).filter(
					item => item.request == null
				).forEach(item => {

					if(item.response != null) {

						if(item.response.status != null) {

							if(item.response.status > status)
								status = item.response.status;
						}
					}

					if(item.headers != null)
						Object.assign(headers, item.headers);

					if(item.body != null)
						body.push("" + item.body);
				});

				response.writeHead(status, headers);

				if(file) {

					if(body.length > 0) {

						fs.readFile(body[0], function(error, data) {

							if(error) {
								response.statusCode = 500;
								response.end(`ERROR: ${error}.`);
							}
							
							else
								response.end(data);
						});
					}
				}

				else {

					if(body.length == 1)
						response.write(body[0]);
		
					else if(body.length > 1)
						response.write(JSON.stringify(body));
		
					response.end();
				}
			});
		});
	}),
	query: (packet) => {

		try {

			packet = JSON.parse(packet);

			if(!packet.tags.includes("telos-origin") ||
				!packet.tags.includes("initialize")) {

				return;
			}
		}

		catch(error) {
			return;
		}

		let options = packet.content.options.options;
		
		if(options.port != false) {

			telosServer.server = http.createServer(telosServer.process);

			telosServer.server.listen(
				process.env.PORT || (options.port != null ? options.port : 80)
			);

			console.log("TELOS SERVER ON!");
		}
	},
	server: null,
	tags: ["telos-origin", "telos-server"]
}

if(typeof module == "object")
	module.exports = telosServer;