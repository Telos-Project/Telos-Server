var serverUtils = require("./serverUtils.js");
var fs = require("fs");
var http = require("http");
var https = require("https");
var busNet = use("bus-net");

var telosServer = {
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

		telosServer.server = http.createServer((request, response) => {

			serverUtils.processRequest(request, "http", (data) => {

				let responses = busNet.call(data);

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

		let options = Array.isArray(packet.content.arguments) ?
			serverUtils.getArgOptions(packet.content.arguments) : { };
		
		telosServer.server.listen(options.port != null ? options.port : 80);

		console.log("TELOS SERVER ON!");
	},
	server: null,
	tags: ["telos-origin", "telos-server"]
}

if(typeof module == "object")
	module.exports = telosServer;