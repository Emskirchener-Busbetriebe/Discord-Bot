const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: 'emskirchener-bus-betriebe.lima-db.de',
    user: 'USER445815_bot',
    password: process.env.DB_PASSWORD,
    database: 'db_445815_2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const WARN_CHANNEL_ID = '1395677255333707796';

async function addWarn(guildId, userId, username, reason, moderatorId, moderatorUsername) {
    try {
        const [warnCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM warns WHERE discordID = ?',
            [userId]
        );

        const now = new Date();
        await pool.execute(
            'INSERT INTO warns (discordID, discordUsername, reason, moderatorID, moderatorUsername, date, time, warncount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                userId,
                username,
                reason,
                moderatorId,
                moderatorUsername,
                now.toISOString().split('T')[0],
                now.toTimeString().split(' ')[0],
                warnCount[0].count + 1
            ]
        );

        return {
            username,
            reason,
            timestamp: now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
            warnCount: warnCount[0].count + 1
        };
    } catch (error) {
        console.error('Datenbankfehler:', error);
        throw error;
    }
}

async function getUserWarns(userId) {
    try {
        const [warns] = await pool.execute(
            'SELECT * FROM warns WHERE discordID = ? ORDER BY date DESC, time DESC',
            [userId]
        );
        return warns;
    } catch (error) {
        console.error('Datenbankfehler:', error);
        throw error;
    }
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
        try {
            await interaction.deferReply();

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');

            const warn = await addWarn(
                interaction.guild.id,
                user.id,
                user.username,
                reason,
                interaction.user.id,
                interaction.user.username
            );

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
        } catch (error) {
            console.error('Fehler:', error);
            await interaction.editReply({ content: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.' });
        }
    },
    getUserWarns
};