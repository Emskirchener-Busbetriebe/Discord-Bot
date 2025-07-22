const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zeitabfrage')
        .setDescription('Fragt den Nutzer nach einer Uhrzeit'),
    async execute(interaction) {
        // 🔧 Debug-Ausgabe: Channel-ID
        console.log('Collector-Channel:', interaction.channel?.id);

        // 📢 Frage sichtbar im Channel
        await interaction.reply('Bitte gib eine Uhrzeit im Format `HH:MM` ein (z. B. `14:30`):');

        // 👂 Filter für Nachrichten des aufrufenden Nutzers
        const filter = msg => msg.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, time: 60_000, max: 1 });

        // ✅ Wenn der Nutzer antwortet
        collector.on('collect', async msg => {
            const input = msg.content.trim();
            const match = input.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

            if (match) {
                await interaction.followUp(`✅ Du hast **${input}** eingegeben.`);
            } else {
                await interaction.followUp(`❌ Ungültiges Format! Bitte verwende \`HH:MM\`.`);
            }
        });

        // ⏰ Wenn der Nutzer nichts eingibt
        collector.on('end', async collected => {
            if (collected.size === 0) {
                await interaction.followUp('⏰ Du hast keine Uhrzeit eingegeben.');
            }
        });
    }
};
