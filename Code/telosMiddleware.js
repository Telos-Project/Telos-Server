var pup = require("universal-preprocessor");
var virtualSystem = require("virtual-system");

let extensionTypes = {
	'txt': 'text/plain',
	'ico': 'image/x-icon',
	'html': 'text/html',
	'js': 'text/javascript',
	'json': 'application/json',
	'css': 'text/css',
	'png': 'image/png',
	'jpg': 'image/jpeg',
	'wav': 'audio/wav',
	'mp3': 'audio/mpeg',
	'svg': 'image/svg+xml',
	'pdf': 'application/pdf',
	'doc': 'application/msword',
	'mp4': 'video/mp4'
};

let apiCache = { };

function middlewareFile(packet, file) {
					
	if(file.type == "folder" || file.meta?.api != null)
		return null;

	return {
		headers: {
			"Content-Type": extensionTypes[file.type] != null ?
				extensionTypes[file.type] :
				(file.meta?.pup == null ?
					"application/octet-stream" : "text/plain")
		},
		body: file.meta?.pup == null ?
			file.file :
			pup.preprocess(
				virtualSystem.getResource(
					file.file.split(":\\").join("://").split("\\").join("/")
				)
			),
		file: file.meta?.pup == null
	}
}

function middlewareFolder(packet, file) {
	
	if(file.type != "folder")
		return null;

	return {
		headers: {
			"Content-Type": "text/json"
		},
		body: JSON.stringify(
			virtualSystem.getResource(file.file), null, "\t"
		)
	}
}

function middlewareJS(packet, file) {

	if(file.meta.api != null && file.type == "js") {

		try {

			apiCache[file.file] =
				apiCache[file.file] != null ?
					apiCache[file.file] :
					use(
						virtualSystem.getResource(file.file), { dynamic: true }
					);

			let response = apiCache[file.file](packet);

			return response != null ? response : { };
		}

		catch(error) {

			return {
				headers: {
					"Content-Type": "text/html"
				},
				body: `
					<!DOCTYPE HTML>
					<html lang="en-US">
						<head></head>
						<body>
							<pre>${"" + error.stack}</pre>
						</body>
					</html>
				`
			};
		}
	}

	if(file.meta.app != null && file.type == "js") {

		return {
			headers: {
				"Content-Type": "text/html"
			},
			body: `
				<script>

					${pup.preprocess(
						virtualSystem.getResource(
							file.file.
								split(":\\").join("://").split("\\").join("/")
						)
					)}

				</script>
			`
		}
	}

	if(file.meta.app != null && file.type == "json") {

		return {
			headers: {
				"Content-Type": "text/html"
			},
			body: `
				<script src="https://cdn.jsdelivr.net/gh/Telos-Project/JustUI/Code/JustUI.js"></script>
				<script>

					JustUI.core.extend(JSON.parse("${
						JSON.stringify(
							pup.preprocess(
								virtualSystem.getResource(
									file.file.
										split(":\\").join("://").
										split("\\").join("/")
								)
							)
						)
					}");

				</script>
			`
		}
	}
}

module.exports = {
	extensionTypes,
	middleware: {
		middlewareFile,
		middlewareFolder,
		middlewareJS
	}
};