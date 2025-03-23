const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-info')
        .setDescription('Zeigt Informationen über den Server an.'),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: 'Dieser Befehl kann nur auf einem Server verwendet werden!',
                ephemeral: true
            });
        }

        const guild = interaction.guild;

        const owner = await guild.fetchOwner();
        const ownerTag = owner.user.tag;
        const ownerMention = owner.user.toString();

        const serverInfo = `
- **Owner**: ${ownerTag} (${ownerMention})
- **Server Name**: ${guild.name}
- **Member Count**: ${guild.memberCount}

**Channel anzahl**: ${guild.channels.cache.size}  
**Server ID**: ${guild.id}  
**Erstellt**: vor ${Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24 * 365))} Jahren  
**Rollen [${guild.roles.cache.size}]**:  
${guild.roles.cache.map(role => role.toString()).slice(0, 10).join(', ')}  
und ${guild.roles.cache.size - 10} weitere Rollen
        `;

        const embed = new EmbedBuilder()
            .setTitle(guild.name)
            .setDescription(serverInfo)
            .setColor(0x0099FF)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({
                text: `Emskirchener Busbetriebe | Bot`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};