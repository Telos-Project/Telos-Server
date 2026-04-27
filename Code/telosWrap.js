var fs = require("fs");
var path = require("path");

module.exports = require(
	"telos-origin/telosUtils.js"
).createCommand("wrap", (package, args) => {

	try {

		let packagePath = `${process.cwd()}${path.sep}package.json`;
		let ignorePath = `${process.cwd()}${path.sep}.gitignore`;
		let telosPath = `${process.cwd()}${path.sep}telosOrigin.js`;

		let packageJSON = { };

		if(fs.existsSync(packagePath)) {

			packageJSON = JSON.parse(
				fs.readFileSync(packagePath, "utf-8")
			);
		}

		packageJSON.scripts =
			packageJSON.scripts != null ? packageJSON.scripts : { };

		packageJSON.main = "telosOrigin.js";
		packageJSON.scripts.start = "node telosOrigin.js";

		if(!fs.existsSync(ignorePath)) {

			fs.writeFileSync(
				ignorePath, "node_modules/\npackage-lock.json"
			);
		}

		fs.writeFileSync(
			packagePath, JSON.stringify(packageJSON, null, "\t")
		);

		if(!fs.existsSync(telosPath)) {

			fs.writeFileSync(
				telosPath, fs.readFileSync(
					`${
						process.cwd()
					}${
						path.sep
					}node_modules${
						path.sep
					}telos-origin${
						path.sep
					}telosOrigin.js`,
					'utf8'
				)
			);
		}
	}

	catch(error) {
		
	}
});