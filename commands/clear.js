const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Löscht Nachrichten im Kanal.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Anzahl der Nachrichten')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        if (amount < 1) {
            return interaction.reply({ content: 'Anzahl zulöschender Nachrichten.', ephemeral: true });
        }

        let deletedMessages = 0;
        while (deletedMessages < amount) {
            const deleteCount = Math.min(amount - deletedMessages, 100);
            const messages = await interaction.channel.bulkDelete(deleteCount, true);
            deletedMessages += messages.size;

            if (messages.size < deleteCount) {
                break;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Nachrichten gelöscht')
            .setDescription(`${deletedMessages} Nachrichten wurden erfolgreich gelöscht.`)
            .setColor('Green')
            .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
