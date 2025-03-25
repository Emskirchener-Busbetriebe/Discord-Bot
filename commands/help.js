const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Listed die Befehle und deren Funktion auf.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Befehle 🤖')
            .setDescription('Hier sind die verfügbaren Befehle für den Emskirchener Busbetriebe Discord Bot:')
            .addFields(
                { name: '/ping', value: 'Ein einfacher `/ping`-Befehl, der mit der aktuellen Latenz in Millisekunden antwortet.' },
                { name: '/quote', value: 'Mit dem `/quote`-Befehl zeigt der Bot ein zufälliges Zitat mithilfe der zenquotes.io-API an.' },
                { name: '/meme', value: 'Mit `/meme` zeigt der Bot ein zufälliges Meme mithilfe der Meme-API an.' },
                { name: '/uptime', value: 'Ein `/uptime`-Befehl, der die Laufzeit des Discord Bots anzeigt.' },
                { name: '/clear', value: 'Der `/clear`-Befehl löscht eine bestimmte Anzahl von Nachrichten in einem Kanal.' },
                { name: '/bot-info', value: 'Zeigt Informationen über den Bot an.' },
                { name: '/server-info', value: 'Zeigt Informationen den Discord-Server an.' },
                { name: '/shift list', value: 'Listet alle aktiven Schichten inklusive Teilnehmer auf.' },
                { name: '/shift join', value: 'Tritt einer Schicht bei und wähle Bus und Linie aus.' },
                { name: '/shift leave', value: 'Verlasse eine Schicht anhand von Datum und Uhrzeit.' }
            )
            .setColor('#00ff00')
            .setFooter({ text: `Emskirchener Busbetriebe | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
