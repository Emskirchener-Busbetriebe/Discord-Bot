const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Zeigt die Uptime des Bots an.'),
    async execute(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let uptimeString = '';
        if (days > 0) uptimeString += `${days} Tag${days !== 1 ? 'e' : ''}, `;
        uptimeString += `${hours} Stunde${hours !== 1 ? 'n' : ''}, `;
        uptimeString += `${minutes} Minute${minutes !== 1 ? 'n' : ''}, `;
        uptimeString += `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Bot Uptime')
            .setDescription(`Der Bot läuft seit:\n**${uptimeString}**`)
            .setFooter({
                text: interaction.client.user.username,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};