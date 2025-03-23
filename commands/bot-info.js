const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-info')
        .setDescription('Zeigt Informationen über den Bot an.'),
    async execute(interaction){
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Informationen 🤖')
            .setDescription('Hier sind aktuelle Informationen zu dem Emskirchener Busbetriebe Discord Bot.')
            .addFields(
                { name: '👨‍💻 Developer', value: '**Developer:** Leon.H43 aka. Gamer443' },
                { name: '🔢 Version', value: '**Version:** 1.0 🔥' },
            )
            .setColor('#00ff00')
            .setFooter({ text: `Emskirchener Busbetriebe | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
