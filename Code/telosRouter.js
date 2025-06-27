var apint = require("apint");
var path = require("path");
var serverUtils = require("./serverUtils.js");

var config = serverUtils.getConfigOptions();

config.directories = config.directories != null ?
	config.directories : [process.cwd() + path.sep + "telos"];

config.directories = config.directories.map(
	item => item.startsWith("./") ?
		process.cwd() + path.sep + item.substring(2) : item
);

config.default = { };

var telosRouter = {
	middleware: [],
	query: (packet) => {

		if(typeof packet == "string") {

			try {

				packet = JSON.parse(packet);

				let middleware = [];

				apint.queryUtilities(
					packet.content.APInt,
					null,
					{
						type: "telos-server-middleware"
					}
				).forEach(item => {

					let busModules = use(
						Array.isArray(item.source) ?
							item.source[0] : item.source
					);

					(Array.isArray(busModules) ?
						busModules : [busModules]
					).forEach(
						busModule =>
							middleware = middleware.concat(
								Object.values(busModule.middleware)
							)
					);
				});

				telosRouter.middleware = middleware;

				return;
			}

			catch(error) {

			}
		}

		if(!serverUtils.isHTTPJSON(packet))
			return null;

		let file = serverUtils.getFile(
			packet.request.uri,
			config.directories
		);

		let response = telosRouter.middleware.map(
			item => {
				
				try {
					return item(packet, file);
				}

				catch(error) {
					return null;
				}
			}
		).filter(
			item => item != null
		)[0];

		if(response != null)
			return response;

		return {
			response: {
				status: 404
			},
			headers: {
				"Content-Type": "text/html"
			},
			body: `
				<!DOCTYPE HTML>
				<html lang="en-US">
					<head>
						${config.default.missing != null ?
							`<meta
								http-equiv="refresh"
								content="0; url=${
									config.default.missing
								}"
							/>` :
							""
						}
					</head>
					<body>
						${config.default.missing == null ?
							"<pre>404: Not Found</pre>" :
							""
						}
					</body>
				</html>
			`
		};
	},
	tags: ["telos-origin", "telos-router"]
};

module.exports = telosRouter;