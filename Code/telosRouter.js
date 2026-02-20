var apint = require("apint");
var path = require("path");
var serverUtils = require("./serverUtils.js");

var telosRouter = {
	config: {
		directories: [process.cwd() + path.sep + "telos"],
		default: { }
	},
	middleware: [],
	query: (packet) => {

		if(typeof packet == "string") {

			try {

				packet = JSON.parse(packet);

				if(packet.tags != null) {

					if(packet.tags.length == 1 &&
						packet.tags[0] == "telos-engine") {
					
						telosRouter.tasks = telosRouter.tasks != null ?
							telosRouter.tasks :
							Object.values(
								serverUtils.getAllFiles(
									telosRouter.config.directories
								)
							).filter(
								item => item != null
							).filter(
								item =>
									Object.keys(item.meta).includes("task") &&
										item.type == "js"
							).map(
								item => item.file
							);

						telosRouter.tasks.forEach(item => {

							try {
								use(item)();
							}

							catch(error) {
								console.log(error);
							}
						});

						return;
					}
				}

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

				Object.assign(
					telosRouter.config,
					packet.content.options.options
				);

				telosRouter.config.directories =
					telosRouter.config.directories.map(
						item => item.startsWith("./") ?
							process.cwd() + path.sep + item.substring(2) : item
					);

				return;
			}

			catch(error) {

			}
		}

		if(!serverUtils.isHTTPJSON(packet))
			return null;

		let file = serverUtils.getFile(
			packet.request.uri,
			telosRouter.config.directories
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
						${telosRouter.config.default.missing != null ?
							`<meta
								http-equiv="refresh"
								content="0; url=${
									telosRouter.config.default.missing
								}"
							/>` :
							""
						}
					</head>
					<body>
						${telosRouter.config.default.missing == null ?
							"<pre>404: Not Found</pre>" :
							""
						}
					</body>
				</html>
			`
		};
	},
	tasks: null,
	tags: ["telos-origin", "telos-router"]
};

module.exports = telosRouter;