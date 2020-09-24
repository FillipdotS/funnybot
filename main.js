// Requirements
const config = require('./config.json');
const Discord = require('discord.js');
const fs = require('fs');

// Setup
const botPrefix = config.prefix;
const client = new Discord.Client();

/**
 * Data storage:
 * - Each server is stored as a JSON file
 * - This file contains an array of objects
 * - Objects consist of user id, and funnypoints
 */

client.on('ready', async () => {
    console.log("FunnyBot initialized");
    client.user.setPresence({ activity: { name: 'f!help' }, status: 'online' })
});

client.on('message', async message => {
    // Don't respond to other bots
    if (message.author.bot) return;

    // Only respond to server messages
    if (message.guild && message.content.startsWith(botPrefix)) {
        let args = message.content.slice(botPrefix.length).split(/\s+/);
        const command = args.shift().toLowerCase();

        //console.log(command);
        //console.log(args);
        //console.log(message.guild.id);

        switch (command) {
            case 'help':
                sayHelp(message.channel);
                break;
            case 'give':
                givePoint(message);
                break;
            case 'stats':
                getStats(message);
                break;
            case 'leaderboard':
                makeLeaderboard(message);
                break;
            case 'take':
                message.channel.send('Good vibes only.');
                break;
            case 'say':
                sayMsg(message, message.content.slice(5));
                break;
            default:
                message.channel.send('Unknown command, maybe try \'f!help\'?');
        }
    }
});

function sayHelp(channel) {
    fullMsg = '';

    fullMsg += 'f!help - Shows this\n';
    fullMsg += 'f!give <user> - Give a funnypoint to someone\n';
    fullMsg += 'f!stats <user> - Show your funnypoints off\n';
    fullMsg += 'f!leaderboard - The funny gods\n';
    fullMsg += 'f!say - Says your funny message\n';
    fullMsg += 'f!take <user> - You wouldn\'t dare...';

    channel.send(fullMsg);
}

function givePoint(message) {
    const guild = message.guild;
    const guildFile = './data/guild' + guild.id + '.json'
    const user = message.mentions.users.first();

    if (!user) {
        message.channel.send('But WHO do you want to give the funnypoint to?');
        return;
    }

    if (user.id === message.author.id) {
        message.channel.send('Nice try buddy.');
        return;
    }

    console.log(message.author.id + " gave a point to " + user.id + " on server " + guild.id);

    if (!fs.existsSync(guildFile)) {
        console.log('Didn\'t find file for guild %s, creating one now', guild.id);

        let emptyGuild = { 'users': [] };

        fs.writeFileSync(guildFile, JSON.stringify(emptyGuild), (err) => {
            if (err) return console.log(err);
        });
    }

    // Open JSON file
    let userData;
    let guildData;
    if (fs.existsSync(guildFile)) {
        guildData = JSON.parse(fs.readFileSync(guildFile));
    } else {
        guildData = { 'users': [] };
    }

    guildData.users.some((u) => {
        if (u.user === user.id) {
            u.points++;
            userData = u;
            return true;
        }
        return false;
    });

    if (!userData) {
        userData = { 'user': user.id, 'points': 1 };
        guildData.users.push(userData)
    };

    // Close JSON file
    fs.writeFileSync(guildFile, JSON.stringify(guildData), (err) => {
        if (err) return console.log(err);
    });

    message.channel.send('Gave ' + user.toString() + ' a funny point! They now have :rofl: ' + userData.points + ' points.');
}

function sayMsg(message, toSay) {
    message.channel.send(toSay, { tts: true });
}

function makeLeaderboard(message) {
    const guildFile = './data/guild' + message.guild.id + '.json'

    fs.readFile(guildFile, async (err, data) => {
        if (err) return console.log(err);

        guildData = JSON.parse(data);

        const toShowData = guildData.users.sort((a, b) => {
            return b.points - a.points;
        }).slice(0, 10);

        let toShowText = '';
        for (i = 0; i < toShowData.length; i++) {
            const user = await client.users.fetch(toShowData[i].user);

            let nickname;

            try {
                nickname = message.guild.member(toShowData[i].user).displayName;
            } catch (e) {
                nickname = "Unknown User";
            }

            toShowText += '**' + (i+1) + '.** ';
            toShowText += nickname;
            toShowText += ' - :rofl: ' + toShowData[i].points + '\n';
        }

        const leadEmbed = new Discord.MessageEmbed()
            .setColor('#f5d742')
            .setTitle('The funniest of ' + message.guild.name)
            .setDescription(toShowText);
        message.channel.send(leadEmbed);
    });
}

function getStats(message) {
    let userToCheck;
    const guildFile = './data/guild' + message.guild.id + '.json'

    if (message.mentions.users.first()) {
        userToCheck = message.mentions.users.first();
    } else {
        userToCheck = message.author;
    }

    let guildData
    fs.readFile(guildFile, (err, data) => {
        if (err) return console.log(err);

        guildData = JSON.parse(data);

        let userPoints = 0;
        guildData.users.some((u) => {
            if (u.user == userToCheck.id) {
                userPoints = u.points;
                return true;
            }
            return false;
        });

        message.channel.send(userToCheck.toString() + ' has ' + userPoints + ' :rofl: points');
    });
}

// Login and begin working
client.login(config.token);