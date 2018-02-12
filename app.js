var fs = require("fs");
var tmi = require("tmi.js");
var _ = require('lodash');
Promise = require('bluebird');
const Discord = require('discord.js');
const discordclient = new Discord.Client();

//********************************
// Authentication and config
//********************************

var DISCORD_CLIENT_LOGIN = "";
var DISCORD_TARGET_GUILD_ID = "";

var TWITCH_BOT_USERNAME = "";
var TWITCH_BOT_PASSWORD = "";
var TWITCH_APP_CLIENT_ID = "";
var TWITCH_TARGET_CHANNEL = []; //One or more channels in format of an array. EX: ["twitch", "twitchpresents", "pacgamer"]

var CHECK_INTERVAL = "60000"; //Interval to check stream status, in milliseconds (1 second = 1000 milliseconds)

//File locations
var ICON_OFFLINE = fs.readFileSync('./offline.png');
var ICON_ONLINE = fs.readFileSync('./online.png');

//********************************
// Do not edit below this line
//********************************

//Connect the Discord client to the server
discordclient.login(DISCORD_CLIENT_LOGIN);

discordclient.on('ready', () => {
	console.log('Discord connection ready!');
});

//Configure Twitch options
var options = {
	options: {
		debug: false
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

twitchclient.on("connected", function (address, port) {
	console.log('Twitch connection ready!');
});

//Run main function every specified check interval
setInterval(runChannels, CHECK_INTERVAL);

//Initialize last uploaded icon
var lasticon = "default";

//Nain function
//Check status of each channel, upload new icon if necessary
function runChannels() {
	var promises = [];

	//Create promise for each channel
	for (var i = 0, len = TWITCH_TARGET_CHANNEL.length; i < len; i++) {

		//Add each promise to promise array
		promises.push(new Promise(function (resolve, reject) {
				var channelname = TWITCH_TARGET_CHANNEL[i];
				//Check channel status
				twitchclient.api({
					url: "https://api.twitch.tv/kraken/streams/" + channelname,
					headers: {
						"Client-ID": TWITCH_APP_CLIENT_ID
					}
				}, function (err, res, body) {

					if (body["stream"] == null) {
						//Channel is OFFLINE
						result = 'offline';

					} else {

						//Channel is ONLINE
						result = 'online';

					}

					resolve(result);

				})
			}));
	}

	//Execute all promises in promise array
	//results is an array of all the responses, in order
	Promise.all(promises).then(function (results) {
		//Check for any online channel
		if (_.indexOf(results, 'online') != (-1)) {
			//Upload online icon when necessary
			if (lasticon != "online") {
				discordclient.guilds.get(DISCORD_TARGET_GUILD_ID).setIcon(ICON_ONLINE)
				.then(updated => console.log('Updated the guild icon to online'))
				.catch (console.error);
				
				//Set last uploaded icon to online
				lasticon = "online";
			}
		} else {
			//Only upload offline icon when necessary
			if (lasticon != "offline") {
				discordclient.guilds.get(DISCORD_TARGET_GUILD_ID).setIcon(ICON_OFFLINE)
				.then(updated => console.log('Updated the guild icon to offline'))
				.catch (console.error);
				
				//Set last uploaded icon to offline
				lasticon = "offline";
			}
		}

	}, function (err) {
		console.log(err);
	});
};
