const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Zeigt ein zufälliges Meme an'),

    async execute(interaction) {
        try {
            const response = await axios.get('https://meme-api.com/gimme');
            const meme = response.data;

            const embed = {
                color: 0x00FF00,
                title: meme.title,
                image: {
                    url: meme.url,
                },
                footer: {
                    text: 'Meme aus der meme-api.com',
                },
            };

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('Es gab ein Problem beim Abrufen des Memes.');
        }
    },
};
