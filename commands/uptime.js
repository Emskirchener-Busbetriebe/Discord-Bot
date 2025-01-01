const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Zeigt die Uptime des Bots an.'),
    async execute(interaction) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const uptimeString = `${hours} Stunden, ${minutes} Minuten, ${seconds} Sekunden`;
        await interaction.reply({ content: `Der Bot läuft seit: ${uptimeString}`, ephemeral: true });
    },
};
