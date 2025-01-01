const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Zeigt ein Zitat an.'),
    async execute(interaction) {
        try {
            const response = await axios.get('https://zenquotes.io/api/random');
            const quote = response.data[0].q;
            const author = response.data[0].a;

            const randomColor = Math.floor(Math.random() * 16777215).toString(16);

            const embed = new EmbedBuilder()
                .setTitle('Dein Zitat')
                .setDescription(`*${quote}*`)
                .setFooter({ text: `~ ${author}` })
                .setColor(`#${randomColor}`);

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Ein Fehler ist beim Abrufen des Zitats aufgetreten. Kontaktiere den Bot Developer!', ephemeral: true });
        }
    }
};
