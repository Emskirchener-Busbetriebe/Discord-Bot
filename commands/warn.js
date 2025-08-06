const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Hilfsfunktionen
function getCorrectBerlinTime() {
    const now = new Date();
    const berlinOffset = now.getTimezoneOffset() + (now.getHours() >= 3 ? 120 : 60);
    return new Date(now.getTime() + berlinOffset * 60000);
}

// Datenbankverbindung
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

// Warn-Funktionen
async function addWarn(guildId, userId, username, reason, moderatorId, moderatorUsername) {
    const [warnCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM warns WHERE discordID = ?',
        [userId]
    );

    const berlinNow = getCorrectBerlinTime();
    const dateStr = berlinNow.toISOString().split('T')[0];
    const timeStr = berlinNow.toTimeString().split(' ')[0].substring(0, 8);

    await pool.execute(
        'INSERT INTO warns (discordID, discordUsername, reason, moderatorID, moderatorUsername, date, time, warncount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, username, reason, moderatorId, moderatorUsername, dateStr, timeStr, warnCount[0].count + 1]
    );

    const formattedTime = berlinNow.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(',', '');

    return {
        username,
        reason,
        timestamp: formattedTime + ' Uhr',
        warnCount: warnCount[0].count + 1
    };
}

async function getUserWarns(userId) {
    const [warns] = await pool.execute(
        'SELECT * FROM warns WHERE discordID = ? ORDER BY date DESC, time DESC',
        [userId]
    );
    return warns;
}

// Slash Command
const command = {
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

        try {
            const warn = await addWarn(
                interaction.guild.id,
                user.id,
                user.username,
                reason,
                interaction.user.id,
                interaction.user.username
            );

            // DM an den User
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setDescription(`Du wurdest auf dem Emskirchener Busbetriebe Discord Server für den Grund **${reason}** gewarnt.`);
                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.error('DM konnte nicht gesendet werden:', dmError);
            }

            // Antwort an den Moderator
            const responseEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`✅ ${user.toString()} wurde mit dem Grund **${reason}** verwarnt. (Warn #${warn.warnCount})`)
                .setFooter({
                    text: 'Emskirchener Busbetriebe | Warnsystem',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Log Embed
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
                .setFooter({
                    text: 'Emskirchener Busbetriebe | Bot',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Log in den Warn-Kanal senden
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
    }
};

// Message Handler für "Ok Garmin, warn @user"
const messageCreate = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.content.startsWith('Ok Garmin, warn ')) return;
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('⛔ Du hast keine Berechtigung, diesen Befehl zu verwenden.');
        }

        const mentionedUser = message.mentions.users.first();
        if (!mentionedUser) {
            return message.reply('⚠️ Bitte erwähne einen User, den du verwarnen möchtest.');
        }

        const reason = message.content.split(' ').slice(3).join(' ');
        if (!reason || reason.length < 3) {
            return message.reply('⚠️ Bitte gib einen gültigen Grund für die Verwarnung an.');
        }

        try {
            const warn = await addWarn(
                message.guild.id,
                mentionedUser.id,
                mentionedUser.username,
                reason,
                message.author.id,
                message.author.username
            );

            // DM an den User
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setDescription(`Du wurdest auf dem Emskirchener Busbetriebe Discord Server für den Grund **${reason}** gewarnt.`);
                await mentionedUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.error('DM konnte nicht gesendet werden:', dmError);
            }

            // Antwort auf die Nachricht
            const responseEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`✅ ${mentionedUser.toString()} wurde mit dem Grund **${reason}** verwarnt. (Warn #${warn.warnCount})`)
                .setFooter({
                    text: 'Emskirchener Busbetriebe | Warnsystem',
                    iconURL: message.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Log Embed
            const logEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⚠️ Neuer Warn')
                .addFields(
                    { name: 'User', value: `${mentionedUser} (${mentionedUser.tag})`, inline: false },
                    { name: 'Moderator', value: `${message.author}`, inline: false },
                    { name: 'Warn #', value: `${warn.warnCount}`, inline: false },
                    { name: 'Grund', value: reason },
                    { name: 'Zeitpunkt', value: warn.timestamp }
                )
                .setFooter({
                    text: 'Emskirchener Busbetriebe | Bot',
                    iconURL: message.client.user.displayAvatarURL()
                })
                .setTimestamp();

            // Log in den Warn-Kanal senden
            try {
                const logChannel = await message.guild.channels.fetch(WARN_CHANNEL_ID);
                await logChannel.send({ embeds: [logEmbed] });
            } catch (error) {
                console.error('Fehler beim Loggen:', error);
            }

            await message.reply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error('Fehler:', error);
            await message.reply('⛔ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
        }
    }
};

module.exports = [command, messageCreate];