const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, ActivityType, REST, Routes } = require('discord.js');
require('dotenv').config();

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();

async function syncCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    const commands = [];
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if (command.data) {
            commands.push(command.data.toJSON());
        } else {
            console.log(`${colors.yellow}[WARN] Command schema validation failed for file: ${filePath}. Missing or invalid "data" property.${colors.reset}`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log(`${colors.cyan}=== [SYNC] Initiating global command synchronization protocol with Discord API... ===${colors.reset}`);

        const currentCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));

        const commandsToRemove = currentCommands.filter(cmd => !commands.some(c => c.name === cmd.name));
        for (const cmd of commandsToRemove) {
            await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, cmd.id));
            console.log(`${colors.yellow}[SYNC] Command deregistration completed: ${cmd.name}${colors.reset}`);
        }

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log(`${colors.green}[SYNC] Global command synchronization completed successfully. All commands are now operational.${colors.reset}`);
    } catch (error) {
        console.log(`${colors.red}[SYNC] Critical failure during command synchronization:${colors.reset}`, error);
        throw error;
    }
}

async function initialize() {
    try {
        await syncCommands();
        console.log(`${colors.cyan}=== [INIT] Command synchronization finalized. Proceeding with bot initialization sequence... ===${colors.reset}`);

        const activityFilePath = path.join(__dirname, 'activityConfig.json');

        function loadActivity() {
            if (!fs.existsSync(activityFilePath)) {
                const defaultActivity = {
                    type: 'Playing',
                    activity: '!!! DEVELOPING VERSION !!! | Emskirchener Busbetriebe Bot',
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
                    client.user.setActivity('!!! DEVELOPING VERSION !!! | Emskirchener Busbetriebe Bot', { type: ActivityType.Playing });
                    saveActivity('Playing', '!!! DEVELOPING VERSION !!! | Emskirchener Busbetriebe Bot', null);
                }, activityData.duration * 60000);
            }

            console.log(`${colors.cyan}=== [ACTIVITY] Bot activity successfully restored ===${colors.reset}`);
            console.log(`\x1b[37mtype:\x1b[0m ${colors.green}${activityData.type}${colors.reset}`);
            console.log(`\x1b[37mactivity:\x1b[0m ${colors.green}${activityData.activity}${colors.reset}`);
            if (activityData.duration) {
                console.log(`\x1b[37mduration:\x1b[0m ${colors.green}${activityData.duration} minutes${colors.reset}`);
            }
        }

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
                        console.log(`${colors.yellow}[WARN] Command schema validation warning: File ${file} lacks a valid "data" property.${colors.reset}`);
                    }
                }
            } else if (commandModule.data) {
                client.commands.set(commandModule.data.name, commandModule);
            } else {
                console.log(`${colors.yellow}[WARN] Command schema validation warning: File ${file} lacks a valid "data" property.${colors.reset}`);
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
                console.log(`${colors.red}[ERROR] Initialization function not found in shift command module.${colors.reset}`);
            }

            console.log(`${colors.cyan}=== [READY] Bot authentication successful. ===${colors.reset}`);
            console.log(`${colors.green}Logged in as: ${client.user.tag}${colors.reset}`);
        });

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.log(`${colors.red}[ERROR] Unhandled exception during command execution:${colors.reset}`, error);
                await interaction.reply({ content: 'A critical error has occurred during command processing.', ephemeral: true });
            }
        });

        await client.login(process.env.TOKEN);

    } catch (error) {
        console.log(`${colors.red}=== [FATAL] Fatal error during bot initialization sequence: ===${colors.reset}`, error);
        process.exit(1);
    }
}

initialize();