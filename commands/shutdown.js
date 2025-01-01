const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Fährt den Bot herunter.'),
    async execute(interaction) {
        const configPath = path.join(__dirname, '..', 'config', 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

        if (interaction.user.id !== config.ownerId) {
            return interaction.reply("Du bist nicht der Besitzer des Bots!");
        }

        await interaction.reply("Der Bot wird heruntergefahren...");
        process.exit();
    }
};
