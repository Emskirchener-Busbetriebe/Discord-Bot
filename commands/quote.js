const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Zeigt ein Zitat an.'),
    async execute(interaction) {
        try {
            // Hole ein zufälliges Zitat von der ZenQuotes API
            const response = await axios.get('https://zenquotes.io/api/random');
            const quote = response.data[0].q;
            const author = response.data[0].a;

            // Zufällige Farbe generieren
            const randomColor = Math.floor(Math.random() * 16777215).toString(16); // Zufälliger Hex-Farbcode

            // Erstelle das Embed
            const embed = new EmbedBuilder()
                .setTitle('Dein Zitat')
                .setDescription(`*${quote}*`)
                .setFooter({ text: `~ ${author}` })
                .setColor(`#${randomColor}`); // Zufällige Farbe

            // Sende das Embed zurück
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Ein Fehler ist beim Abrufen des Zitats aufgetreten. Kontaktiere den Bot Developer!', ephemeral: true });
        }
    }
};
