const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const WARN_CHANNEL_ID = '1395677255333707796';
const WARN_DATA_PATH = path.join(__dirname, 'warnData.json');

function ensureWarnDataFile() {
    if (!fs.existsSync(WARN_DATA_PATH)) {
        fs.writeFileSync(WARN_DATA_PATH, JSON.stringify({}, null, 2));
    }
}

function loadWarnData() {
    ensureWarnDataFile();
    return JSON.parse(fs.readFileSync(WARN_DATA_PATH));
}

function saveWarnData(data) {
    fs.writeFileSync(WARN_DATA_PATH, JSON.stringify(data, null, 2));
}

function addWarn(guildId, userId, username, reason) {
    const data = loadWarnData();
    const now = new Date();
    
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][userId]) data[guildId][userId] = [];
    
    const warn = {
        username: username,
        reason: reason,
        timestamp: now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
        warnCount: data[guildId][userId].length + 1
    };
    
    data[guildId][userId].push(warn);
    saveWarnData(data);
    return warn;
}

function getUserWarns(guildId, userId) {
    const data = loadWarnData();
    return data[guildId]?.[userId] || [];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warne einen User')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der zu warnende User')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Grund für den Warn')
                .setRequired(true)),

    execute: async (interaction) => {
        await interaction.deferReply();
        
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const guildId = interaction.guild.id;
        
        const warn = addWarn(guildId, user.id, user.username, reason);
        
        const responseEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⚠️ Warn erfolgreich')
            .setDescription(`${user.tag} wurde verwarnt. (Warn #${warn.warnCount})`);

        const logEmbed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('⚠️ Neuer Warn')
            .addFields(
                { name: 'User', value: `${user} (${user.tag})`, inline: false },
                { name: 'Moderator', value: `${interaction.user}`, inline: false },
                { name: 'Warn #', value: `${warn.warnCount}`, inline: false },
                { name: 'Grund', value: reason },
                { name: 'Zeitpunkt', value: warn.timestamp }
            )
            .setFooter({ text: `Emskirchener Busbetriebe | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();
        
        try {
            const logChannel = await interaction.guild.channels.fetch(WARN_CHANNEL_ID);
            await logChannel.send({ embeds: [logEmbed] });
        } catch (error) {
            console.error('Fehler beim Loggen:', error);
        }
        
        await interaction.editReply({ embeds: [responseEmbed] });
    },
    loadWarnData,
    saveWarnData,
    getUserWarns
};

ensureWarnDataFile();
