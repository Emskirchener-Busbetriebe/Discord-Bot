const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const channelId = '1292874725370101822'; // ID Welcome Channel
        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle('👋 Willkommen!')
            .setDescription(`Willkommen auf dem ÖPNV Germany Discord-Server, ${member}! 🎉`)
            .setColor('#00ff00')
            .setTimestamp()
            .setFooter({ text: 'Hast du Fragen? Frag einfach einen Moderator!' });

        const message = await channel.send({ embeds: [embed] });
        await message.react('👋');
    }
};
