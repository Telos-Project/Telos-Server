var fs = require("fs");
var path = require("path");

var extensionTypes = {
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

var fileTypes = [
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

function getArgOptions(args) {

	let options = { };

	args.forEach((item, index) => {

		if(item.startsWith("-") && index < args.length - 1)
			options[item.substring(1)] = args[index + 1];
	});

	return options;
}

function getConfigOptions() {

	try {

		return JSON.parse(
			fs.readFileSync("./APInt.json", "utf-8")
		).utilities["telos-config"].properties;
	}

	catch(error) {
		return { };
	}
}

function getFile(uri, directories) {

	try {

		uri = uri.substring(uri.indexOf("://") + 3);

		if(uri.includes("/"))
			uri = uri.substring(uri.indexOf("/"));

		if(uri.includes("?"))
			uri = uri.substring(0, uri.indexOf("?"));

		return getFiles(
			uri.split("/").filter(item => item.length > 0),
			directories
		).map(file => {

			let type = file.includes(".") ?
				file.substring(file.lastIndexOf(".") + 1) : null;

			let result = {
				file: file,
				folder: fs.lstatSync(file).isDirectory(),
				meta: file.split(/[\/\\]/).map(item =>
					item.split(".").slice(1).reduce(
						(value, item) => {

							item = item.split("-");

							let key = item[0].toLowerCase()

							if(key != type)
								value[key] = item.slice(1).join("-");

							return value;
						},
						{ }
					)
				).reduce((value, item) => Object.assign(value, item), { }),
				type: type
			}

			return result.meta.private == null ? result : null;
		})[0];
	}

	catch(error) {
		return null;
	}
}

function getFiles(items, paths) {

	paths = paths != null ? paths : [];

	let files = [];

	if(items.length > 0) {

		let alias = items[0].split(".")[0];

		paths.forEach(file => {

			try {

				fs.readdirSync(file).forEach(item => {

					if(item.toLowerCase().startsWith(alias.toLowerCase()))
						files.push(file + path.sep + item);
				});
			}

			catch(error) {
				
			}
		});
	}

	if(files.length == 0) {

		paths.forEach(file => {

			try {
		
				fs.readdirSync(file).forEach(item => {
		
					if(item.toLowerCase().startsWith("index"))
						files.push(file + path.sep + item);
				});
			}
	
			catch(error) {
	
			}
		});

		if(files.length == 0)
			return null;
	}

	if(files.length > 1) {

		let match = files.filter(file =>
			file.toLowerCase().endsWith(items[0].toLowerCase())
		);

		files = match.length > 0 ? match : files;
	}

	if(items.length < 2)
		return files;

	return files.map(item =>
		getFiles(items.slice(1), [item])
	).filter(item => item != null).reduce(
		(value, item) => value.concat(item), []
	);
}

function isHTTPJSON(json) {

	if(json == null)
		return false;

	if(typeof json != "object")
		return false;

	let keys = Object.keys(json);
	let fields = ["request", "response", "headers", "body"];

	for(let i = 0; i < keys.length; i++) {

		if(!fields.includes(keys[i]))
			return false;
	}

	if(json.request != null && json.response != null)
		return false;

	if((json.request != null && typeof json.request != "object") ||
		(json.response != null && typeof json.response != "object") ||
		(json.headers != null && typeof json.headers != "object") ||
		(json.body != null && typeof json.body != "string")) {
		
		return false;
	}

	let flag = false;
	fields = ["uri", "method"];

	[
		["request", ["uri", "method", "version"]],
		["response", ["status", "version"]]
	].forEach(item => {

		fields = item[1];
		item = json[item[0]];

		if(item == null)
			return;

		Object.keys(item).forEach(key => {

			if(!fields.includes(key))
				flag = true;

			else if(key == "status" && typeof item[key] != "number")
				flag = true;

			else if(key != "status" && typeof item[key] != "string")
				flag = true;
		});
	});

	if(flag)
		return false;

	let headers = json.headers != null ? Object.values(json.headers) : [];

	for(let i = 0; i < headers.length; i++) {

		if(typeof headers[i] != "string")
			return false;
	}

	return true;
}

function processRequest(request, protocol, callback) {

	let text = null;

	request.on('data', (chunk) => {
		text = (text != null ? text : "") + chunk.toString();
	}).on('end', () => {
		callback({
			request: {
				method: request.method,
				uri: protocol +
					"://" +
					request.headers.host +
					request.url
			},
			headers: request.headers,
			body: text
		});
	});
}

module.exports = {
	extensionTypes,
	fileTypes,
	getArgOptions,
	getConfigOptions,
	getFile,
	getFiles,
	isHTTPJSON,
	processRequest
};