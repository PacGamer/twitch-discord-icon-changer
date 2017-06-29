var fs = require("fs");
var tmi = require("tmi.js");
const Discord = require('discord.js');
const discordclient = new Discord.Client();

var DISCORD_CLIENT_LOGIN = "";
var DISCORD_TARGET_GUILD_ID = "";

var TWITCH_BOT_USERNAME = "";
var TWITCH_BOT_OAUTH = "";
var TWITCH_TARGET_CHANNEL = "";
var TWITCH_APP_CLIENT_ID = "";

discordclient.on('ready', () => {
	console.log('I am ready!');
});

// Connect the Discord client to the server
discordclient.login(DISCORD_CLIENT_LOGIN);

var options = {
	options: {
		debug: true
	},
	connection: {
		reconnect: true
	},
	identity: {
		username: TWITCH_BOT_USERNAME,
		password: TWITCH_BOT_OAUTH
	},
	channels: ["#" + TWITCH_TARGET_CHANNEL]
};

var twitchclient = new tmi.client(options);

// Connect the Twitch client to the server
twitchclient.connect();

twitchclient.on("connected", function (address, port) {
	streamStatus(TWITCH_TARGET_CHANNEL);
	loop();
});

function loop() {
	setTimeout(function () {
		loop();
		streamStatus(TWITCH_TARGET_CHANNEL);
	}, 60000);

};

var lasticon = "";

function streamStatus(channelname) {
	twitchclient.api({
		url: "https://api.twitch.tv/kraken/streams/" + channelname,
		headers: {
			"Client-ID": TWITCH_APP_CLIENT_ID
		}
	}, function (err, res, body) {
		//console.log(body);

		if (body["stream"] == null) {
			// Channel is OFFLINE
			console.log("Channel is offline");
			// Edit the guild icon
			if (lasticon != "offline") {
				discordclient.guilds.get(DISCORD_TARGET_GUILD_ID).setIcon(fs.readFileSync('./offline.png'))
				.then(updated => console.log('Updated the guild icon'))
				.catch (console.error);

				lasticon = "offline";
			};

		} else {

			// Channel is ONLINE
			console.log("Channel is online");
			// Edit the guild icon
			if (lasticon != "online") {

				discordclient.guilds.get(DISCORD_TARGET_GUILD_ID).setIcon(fs.readFileSync('./online.png'))
				.then(updated => console.log('Updated the guild icon'))
				.catch (console.error);

				lasticon = "online";
			};
		}

	});
}
