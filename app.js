var fs = require("fs");
var tmi = require("tmi.js");
const Discord = require('discord.js');
const discordclient = new Discord.Client();

var DISCORD_CLIENT_LOGIN = "";
var DISCORD_TARGET_GUILD_ID = "";

var TWITCH_BOT_USERNAME = "";
var TWITCH_BOT_PASSWORD = "";
var TWITCH_TARGET_CHANNEL = []; //One or more channels in format of an array. EX: ["twitch", "twitchpresents", "pacgamer"]
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
		password: TWITCH_BOT_PASSWORD
	},
	channels: ["#" + TWITCH_BOT_USERNAME]
};

var twitchclient = new tmi.client(options);

// Connect the Twitch client to the server
twitchclient.connect();

//Run initial check and begin loop
twitchclient.on("connected", function (address, port) {
	runChannels();
	loop();
});

//Initialize some variables
var lasticon = "online";
var endofarray = false;
var user_online_name = "";
var user_online_found = false;

function loop() {
	setTimeout(function () {
		loop();
		runChannels();
	}, 60000) //Loop time in milliseconds

};

//Check status of each channel in the array
function runChannels() {
	endofarray = false;
	user_online_found = false;
	for (var i = 0, len = TWITCH_TARGET_CHANNEL.length; i < len; i++) {
		streamStatus(TWITCH_TARGET_CHANNEL[i]);
		if (i == TWITCH_TARGET_CHANNEL.length - 1) {
			endofarray = true;
			discordIcon();
		}
	}
};

//Check individual stream status
function streamStatus(channelname) {
	twitchclient.api({
		url: "https://api.twitch.tv/kraken/streams/" + channelname,
		headers: {
			"Client-ID": TWITCH_APP_CLIENT_ID
		}
	}, function (err, res, body) {

		if (body["stream"] == null) {
			// Channel is OFFLINE
			console.log("Channel \"" + channelname + "\" is offline");

		} else {

			// Channel is ONLINE
			console.log("Channel \"" + channelname + "\" is online");
			user_online_found = true;
			user_online_name = channelname;
		}

	})
};


//Upload Discord icon when necessary
function discordIcon() {
	
	if ((endofarray == true) && (user_online_found == false)) {
		if (lasticon != "offline") {

			discordclient.guilds.get(DISCORD_TARGET_GUILD_ID).setIcon(fs.readFileSync('./offline.png'))
			.then(updated => console.log('Updated the guild icon'))
			.catch (console.error);

			lasticon = "offline";
		}
	}
	if ((endofarray == true) && (user_online_found == true)) {
		if (lasticon != "online") {

			discordclient.guilds.get(DISCORD_TARGET_GUILD_ID).setIcon(fs.readFileSync('./online.png'))
			.then(updated => console.log('Updated the guild icon'))
			.catch (console.error);

			lasticon = "online";
		}
	}

};
