const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Löscht Nachrichten im Kanal.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Anzahl der Nachrichten (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Nachrichten nur von diesem User löschen')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Nachrichten nur von dieser Rolle löschen')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Nachrichten nur aus den letzten X Tagen löschen')
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(14))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');
        const days = interaction.options.getInteger('days');

        if (amount < 1 || amount > 100) {
            return interaction.reply({ content: 'Die Anzahl muss zwischen 1 und 100 liegen.', ephemeral: true });
        }

        let deletedMessages = 0;
        let messagesToDelete = [];
        let lastMessageId;

        while (messagesToDelete.length < amount) {
            const options = { limit: 100 };
            if (lastMessageId) options.before = lastMessageId;

            const messages = await interaction.channel.messages.fetch(options);
            if (messages.size === 0) break;

            for (const message of messages.values()) {
                if (days && message.createdAt < new Date(Date.now() - days * 24 * 60 * 60 * 1000)) {
                    continue;
                }

                if (user && message.author.id !== user.id) {
                    continue;
                }

                if (role && !message.member?.roles.cache.has(role.id)) {
                    continue;
                }

                messagesToDelete.push(message);
                if (messagesToDelete.length >= amount) break;
            }

            lastMessageId = messages.last().id;
        }

        while (messagesToDelete.length > 0) {
            const chunk = messagesToDelete.splice(0, 100);
            await interaction.channel.bulkDelete(chunk, true);
            deletedMessages += chunk.length;
        }

        const embed = new EmbedBuilder()
            .setTitle('Nachrichten gelöscht')
            .setDescription(`${deletedMessages} Nachrichten wurden erfolgreich gelöscht.`)
            .setColor('Green')
            .setFooter({ text: `Emskirchener Busbetriebe | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        if (user) embed.addFields({ name: 'Gefiltert nach User', value: user.tag });
        if (role) embed.addFields({ name: 'Gefiltert nach Rolle', value: role.name });
        if (days) embed.addFields({ name: 'Gefiltert nach Zeitraum', value: `Letzte ${days} Tage` });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};