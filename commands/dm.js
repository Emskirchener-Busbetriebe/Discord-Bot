const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const config = require('../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Sende einem User eine private Nachricht')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der User, der die Nachricht erhalten soll')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Die Nachricht, die gesendet werden soll')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('anonym')
                .setDescription('Soll die Nachricht anonym sein?')
                .setRequired(true)),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: '❌ Dieser Befehl kann nur auf einem Server verwendet werden!', ephemeral: true });
        }

        if (interaction.guildId !== config.mainGuild) {
            return interaction.reply({ content: '❌ Dieser Befehl kann nur auf dem Hauptserver verwendet werden!', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const anonymous = interaction.options.getBoolean('anonym');

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription(`Nachricht vom Emskirchener Busbetriebe Discord Team:\n\n${message}`)
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId('disabled')
                .setLabel(`Nachricht von: ${anonymous ? 'Emskirchener Busbetriebe Team' : interaction.user.tag}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const row = new ActionRowBuilder()
                .addComponents(button);

            await user.send({
                embeds: [dmEmbed],
                components: [row]
            });

            const responseEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(`✅ Nachricht wurde erfolgreich an ${user.toString()} gesendet.`)
                .setFooter({
                    text: 'Emskirchener Busbetriebe | Bot',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error('Fehler beim Senden der DM:', error);
            await interaction.editReply({ content: `⛔ Die Nachricht konnte nicht an ${user.toString()} gesendet werden. Der User hat möglicherweise DMs deaktiviert.`, ephemeral: true });
        }
    }
};