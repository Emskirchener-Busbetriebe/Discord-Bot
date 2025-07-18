const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const WARN_DATA_PATH = path.join(__dirname, 'warnData.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Zeigt alle Warns eines Users an')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User, dessen Warns angezeigt werden sollen')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const rawData = fs.readFileSync(WARN_DATA_PATH);
            const warnData = JSON.parse(rawData);
            
            const user = interaction.options.getUser('user');
            const guildWarns = warnData[interaction.guild.id] || {};
            const userWarns = guildWarns[user.id] || [];

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⚠️ Warns für ${user.tag}`);

            if (userWarns.length === 0) {
                embed.setDescription('Keine Warns vorhanden');
            } else {
                userWarns.slice(0, 25).forEach((warn, i) => {
                    embed.addFields({
                        name: `Warn #${i + 1}`,
                        value: `📅 ${new Date(warn.timestamp).toLocaleString('de-DE')}\n📝 **Grund:** ${warn.reason}`,
                        inline: false
                    });
                });
                embed.setFooter({ text: `Insgesamt ${userWarns.length} Warn(s)` });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Fehler in /warnings:', error);
            await interaction.editReply('❌ Fehler beim Laden der Warns');
        }
    }
};
