const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadWarnData, saveWarnData } = require('./warn');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-warns')
        .setDescription('Löscht alle Warns eines Users')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der User, dessen Warns gelöscht werden sollen')
                .setRequired(true)),
    
    execute: async (interaction) => {
        await interaction.deferReply({ ephemeral: true });
        
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        const data = loadWarnData();
        
        if (!data[guildId] || !data[guildId][user.id]) {
            await interaction.editReply({ content: `${user.tag} hat keine Warns zum Löschen.` });
            return;
        }
        
        const warnCount = data[guildId][user.id].length;
        delete data[guildId][user.id];
        
        if (Object.keys(data[guildId]).length === 0) {
            delete data[guildId];
        }
        
        saveWarnData(data);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Warns gelöscht')
            .setDescription(`Alle ${warnCount} Warns von ${user.tag} wurden entfernt.`)
            .setFooter({ text: `Emskirchener Busbetriebe | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
        try {
            const logChannel = await interaction.guild.channels.fetch('1395677255333707796');
            const logEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⚠️ Warns gelöscht')
                .addFields(
                    { name: 'User', value: `${user.tag}`, inline: false },
                    { name: 'Moderator', value: `${interaction.user.tag}`, inline: false },
                    { name: 'Gelöschte Warns', value: `${warnCount}`, inline: false }
                )
                .setFooter({ text: `Emskirchener Busbetriebe | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Fehler beim Loggen:', error);
        }
    }
};
