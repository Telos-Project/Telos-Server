var apint = require("apint");
var path = require("path");
var serverUtils = require("./serverUtils.js");
var telosUtils = require("telos-origin/telosUtils.js");

function getByType(package, type) {

	return apint.queryUtilities(
		package,
		null,
		utility => Array.isArray(utility.properties?.tags) ?
			utility.properties?.tags?.indexOf(type) == 0 :
			utility.properties?.tags?.toLowerCase() == type.toLowerCase()
	);
}

var telosRouter = {
	config: {
		directories: [],
		options: { }
	},
	middleware: [],
	query: (packet) => {

		if(typeof packet == "string") {

			try {

				packet = JSON.parse(packet);

				if(!packet.tags.includes("telos-origin") ||
					!packet.tags.includes("initialize")) {

					return;
				}

				let middleware = [];

				getByType(
					packet.content, "telos-server-middleware"
				).forEach(item => {

					let modules = use(
						Array.isArray(item.source) ?
							item.source[0] : item.source
					);

					(Array.isArray(modules) ?
						modules : [modules]
					).forEach(
						item =>
							middleware = middleware.concat(
								Object.values(item.middleware)
							)
					);
				});

				telosRouter.middleware = middleware;

				Object.assign(
					telosRouter.config.options,
					telosUtils.getArguments(packet.content).options
				);

				telosRouter.config.directories = getByType(
					packet.content, "telos-folder"
				).map(item => item.content?.startsWith("./") ?
					process.cwd() + path.sep + item.content.substring(2) :
					process.cwd() + path.sep + item.content
				);

				return;
			}

			catch(error) {
				console.log(error);
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
						${telosRouter.config.options.missing != null ?
							`<meta
								http-equiv="refresh"
								content="0; url=${
									telosRouter.config.options.missing
								}"
							/>` :
							""
						}
					</head>
					<body>
						${telosRouter.config.options.missing == null ?
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