const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserWarns } = require('./warn');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Zeigt alle Warns eines Users an')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der User, dessen Warns angezeigt werden sollen')
                .setRequired(true)),
    
    execute: async (interaction) => {
        await interaction.deferReply();
        
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        const warns = getUserWarns(guildId, user.id);
        
        if (warns.length === 0) {
            await interaction.editReply({ content: `${user.tag} hat keine Warns.` });
            return;
        }
        
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle(`⚠️ Warns für ${user.tag}`)
            .setFooter({ text: `Insgesamt ${warns.length} Warn(s)`, iconURL: user.displayAvatarURL() });
        
        warns.forEach((warn, index) => {
            embed.addFields({
                name: `Warn #${index + 1}`,
                value: `**Grund:** ${warn.reason}\n**Datum:** ${warn.timestamp}`,
                inline: false
            });
        });
        
        await interaction.editReply({ embeds: [embed] });
    }
};
