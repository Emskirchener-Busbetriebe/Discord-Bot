const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const config = require('../config/config.json');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-warns')
        .setDescription('Löscht alle Warns eines Users')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der User, dessen Warns gelöscht werden sollen')
                .setRequired(true)),

    execute: async (interaction) => {
        if (!interaction.inGuild()) {
            return await interaction.reply({
                content: '❌ Dieser Befehl kann nur auf einem Server verwendet werden!',
                ephemeral: true
            });
        }

        if (interaction.guildId !== config.mainGuild) {
            return await interaction.reply({
                content: '❌ Dieser Befehl kann nur im Haupt-Server verwendet werden!',
                ephemeral: true
            });
        }

        await interaction.deferReply({ flags: 64 });

        try {
            const user = interaction.options.getUser('user');
            const [result] = await pool.execute(
                'DELETE FROM warns WHERE discordID = ?',
                [user.id]
            );

            const embed = new EmbedBuilder()
                .setColor(result.affectedRows > 0 ? 0x00FF00 : 0xFFA500)
                .setTitle(result.affectedRows > 0 ? '✅ Warns gelöscht' : '⚠️ Keine Warns gefunden')
                .setDescription(result.affectedRows > 0
                    ? `Alle ${result.affectedRows} Warns von ${user.tag} wurden entfernt.`
                    : `${user.tag} hatte keine Warns zum Löschen.`);

            await interaction.editReply({ embeds: [embed] });

            if (result.affectedRows > 0) {
                try {
                    const logChannel = await interaction.guild.channels.fetch('1395677255333707796');
                    await logChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(0xFFA500)
                                .setTitle('⚠️ Warns gelöscht')
                                .addFields(
                                    { name: 'User', value: user.tag },
                                    { name: 'Moderator', value: interaction.user.tag },
                                    { name: 'Anzahl', value: result.affectedRows.toString() }
                                )
                        ]
                    });
                } catch (error) {
                    console.error('Logging fehlgeschlagen:', error);
                }
            }
        } catch (error) {
            console.error('Datenbankfehler:', error);
            await interaction.editReply({
                content: 'Datenbankfehler. Bitte versuche es später erneut.'
            });
        }
    }
};