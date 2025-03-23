const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();

const activityFilePath = path.join(__dirname, 'activityConfig.json');

function loadActivity() {
    if (!fs.existsSync(activityFilePath)) {
        const defaultActivity = {
            type: 'Playing',
            activity: '/help | Emskirchener Busbetriebe Bot',
            duration: null
        };
        fs.writeFileSync(activityFilePath, JSON.stringify(defaultActivity, null, 2));
        return defaultActivity;
    }
    const data = fs.readFileSync(activityFilePath, 'utf8');
    return JSON.parse(data);
}

function saveActivity(type, activity, duration) {
    const activityData = { type, activity, duration };
    fs.writeFileSync(activityFilePath, JSON.stringify(activityData, null, 2));
}

function restoreActivity(client) {
    const activityData = loadActivity();
    const activityTypeMap = {
        'Listening': ActivityType.Listening,
        'Watching': ActivityType.Watching,
        'Playing': ActivityType.Playing,
        'Streaming': ActivityType.Streaming,
        'Competing': ActivityType.Competing
    };

    client.user.setActivity(activityData.activity, { type: activityTypeMap[activityData.type] });

    if (activityData.duration) {
        setTimeout(() => {
            client.user.setActivity('/help | Emskirchener Busbetriebe Bot', { type: ActivityType.Playing });
            saveActivity('Playing', '/help | Emskirchener Busbetriebe Bot', null);
        }, activityData.duration * 60000);
    }

    console.log('Aktivität erfolgreich erstellt:', activityData);
}

// Commands laden
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = require(filePath);

    if (Array.isArray(commandModule)) {
        for (const command of commandModule) {
            if (command.data) {
                client.commands.set(command.data.name, command);
            } else {
                console.warn(`Fehlende 'data'-Eigenschaft in ${file}`);
            }
        }
    } else if (commandModule.data) {
        client.commands.set(commandModule.data.name, commandModule);
    } else {
        console.warn(`Fehlende 'data'-Eigenschaft in ${file}`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', () => {
    restoreActivity(client);

    const shiftCommand = require('./commands/shift');
    if (shiftCommand.init) {
        shiftCommand.init(client);
    } else {
        console.error('Shift-Command hat keine init-Funktion');
    }

    console.log(`Eingeloggt als ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Ein Fehler ist aufgetreten!', ephemeral: true });
    }
});

client.login(process.env.TOKEN);