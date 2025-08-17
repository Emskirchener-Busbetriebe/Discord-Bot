const { SlashCommandBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder } = require('discord.js');

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
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const anonymous = interaction.options.getBoolean('anonym');

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setDescription(`Nachricht vom Emskirchener Busbetriebe Discord Team: ${message}`)

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

            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription(`⛔ Die Nachricht konnte nicht an ${user.toString()} gesendet werden. Der User hat möglicherweise DMs deaktiviert.`)
                .setFooter({
                    text: 'Emskirchener Busbetriebe | Bot',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};