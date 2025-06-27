var fs = use("fs");
var path = use("path");
var pup = require("universal-preprocessor");
var pupLangs = require("universal-preprocessor/pupLangs");

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

let fileTypes = [
	'ico',
	'png',
	'jpg',
	'wav',
	'mp3',
	'svg',
	'pdf',
	'doc',
	'mp4'
];

function middlewareFile(packet, file) {
					
	if(!fileTypes.includes(file.type) || file.type == "folder")
		return;

	return {
		headers: {
			"Content-Type": extensionTypes[file.type]
		},
		body: file.file,
		file: true
	}
}

function middlewareFolder(packet, file) {
	
	if(file.type != "folder")
		return;
	
	let result = [[], []];

	fs.readdirSync(file.file).forEach(item => {

		result[
			fs.lstatSync(
				file.file + path.sep + item
			).isDirectory() ? 0 : 1
		].push(item);
	})

	return {
		headers: {
			"Content-Type": "text/json"
		},
		body: JSON.stringify(result, null, "\t")
	}
}

function middlewareJS(packet, file) {

	if(file.meta.api != null && file.type == "js") {

		try {

			let response = use(file.file)(packet);

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

					${preprocess(
						fs.readFileSync(file.file, "utf-8")
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
				<script>

					var vision = use("kaeon-united")("vision");

					vision.extend(JSON.parse("${
						JSON.stringify(
							preprocess(
								fs.readFileSync(file.file, "utf-8")
							)
						)
					}");

				</script>
			`
		}
	}
}

function middlewareText(packet, file) {
					
	if(fileTypes.includes(file.type) || file.type == "folder")
		return;

	return {
		headers: {
			"Content-Type": extensionTypes[file.type]
		},
		body: preprocess(
			fs.readFileSync(file.file, "utf-8")
		)
	}
}

function preprocess(string, file) {

	return (file != null ? file.meta.pup != null : true) ?
		pup.preprocess(pupLangs, string) : string;
}

module.exports = {
	extensionTypes,
	fileTypes,
	middleware: {
		middlewareFile,
		middlewareFolder,
		middlewareJS,
		middlewareText
	},
	preprocess
};