var busNet = use("bus-net");

var telosEngine = {
	initialization: null,
	interval: null,
	query: (packet) => {

		try {

			packet = JSON.parse(packet);

			if(packet.tags.includes("telos-origin") &&
				packet.tags.includes("initialize")) {

				telosEngine.initialization = packet;

				telosEngine.interval = setInterval(
					() => { busNet.call(`{"tags":["telos-engine"]}`); },
					1000 / 60
				);

				return;
			}

			if(packet.tags.includes("telos-configuration") &&
				packet.tags.length == 1) {

				return telosEngine.initialization = packet;
			}
		}

		catch(error) {
			return;
		}
	},
	tags: ["telos-origin", "telos-engine"]
}

if(typeof module == "object")
	module.exports = telosEngine;