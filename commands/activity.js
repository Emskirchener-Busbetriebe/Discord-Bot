const { SlashCommandBuilder, EmbedBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Pfad zur JSON-Datei
const activityFilePath = path.join(__dirname, 'activityConfig.json');

// Funktion zum Laden der Aktivität aus der JSON-Datei
function loadActivity() {
    if (!fs.existsSync(activityFilePath)) {
        // Erstelle eine Standardkonfiguration, falls die Datei nicht existiert
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

// Funktion zum Speichern der Aktivität in der JSON-Datei
function saveActivity(type, activity, duration) {
    const activityData = { type, activity, duration };
    fs.writeFileSync(activityFilePath, JSON.stringify(activityData, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Verwaltet die Aktivität des Bots.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Setzt die Aktivität des Bots.')
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Der Typ der Aktivität.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Listening', value: 'Listening' },
                            { name: 'Watching', value: 'Watching' },
                            { name: 'Playing', value: 'Playing' },
                            { name: 'Streaming', value: 'Streaming' },
                            { name: 'Competing', value: 'Competing' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('activity')
                        .setDescription('Die Aktivität, die angezeigt werden soll.')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Die Dauer, nach der die Aktivität verschwindet (in Minuten).')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Löscht die aktuelle Aktivität und setzt die Standardaktivität zurück.')
        ),
    async execute(interaction) {
        const { options } = interaction;
        const subcommand = options.getSubcommand();
        const client = interaction.client;

        if (subcommand === 'set') {
            const type = options.getString('type');
            const activity = options.getString('activity');
            const duration = options.getInteger('duration');

            const activityTypeMap = {
                'Listening': ActivityType.Listening,
                'Watching': ActivityType.Watching,
                'Playing': ActivityType.Playing,
                'Streaming': ActivityType.Streaming,
                'Competing': ActivityType.Competing
            };

            // Setze die Aktivität
            client.user.setActivity(activity, { type: activityTypeMap[type] });

            // Speichere die Aktivität in der JSON-Datei
            saveActivity(type, activity, duration);

            if (duration) {
                setTimeout(() => {
                    client.user.setActivity('/help | Emskirchener Busbetriebe Bot', { type: ActivityType.Playing });
                    saveActivity('Playing', '/help | Emskirchener Busbetriebe Bot', null);
                }, duration * 60000);
            }

            const embed = new EmbedBuilder()
                .setTitle('Aktivität gesetzt')
                .setDescription(`Die Aktivität wurde auf **${type} ${activity}** gesetzt.${duration ? ` Sie wird nach **${duration} Minuten** zurückgesetzt.` : ''}`)
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (subcommand === 'delete') {
            // Setze die Standardaktivität zurück
            client.user.setActivity('/help | Emskirchener Busbetriebe Bot', { type: ActivityType.Playing });
            saveActivity('Playing', '/help | Emskirchener Busbetriebe Bot', null);

            const embed = new EmbedBuilder()
                .setTitle('Aktivität gelöscht')
                .setDescription('Die Aktivität wurde zurückgesetzt.')
                .setColor('#00ff00')
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
    // Funktion zum Wiederherstellen der Aktivität beim Start des Bots
    async restoreActivity(client) {
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
    }
};