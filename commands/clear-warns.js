const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');

// Erstelle einen neuen Pool für diese Datei
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'emskirchener-bus-betriebe.lima-db.de',
    user: process.env.DB_USER || 'USER445815_bot',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'db_445815_2',
    port: process.env.DB_PORT || 3306,
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
        try {
            // Neue Methode für deferReply ohne deprecated ephemeral
            await interaction.deferReply({ flags: 64 }); // 64 entspricht EPHEMERAL

            const user = interaction.options.getUser('user');

            const [result] = await pool.execute(
                'DELETE FROM warns WHERE discordID = ?',
                [user.id]
            );

            const embed = new EmbedBuilder()
                .setColor(result.affectedRows > 0 ? 0x00FF00 : 0xFFA500)
                .setTitle(result.affectedRows > 0 ? '✅ Warns gelöscht' : '⚠️ Keine Warns gefunden')
                .setDescription(result.affectedRows > 0
                    ? `Alle Warns von ${user.tag} wurden entfernt.`
                    : `${user.tag} hatte keine Warns zum Löschen.`);

            await interaction.editReply({ embeds: [embed] });

            // Logging nur wenn tatsächlich Warns gelöscht wurden
            if (result.affectedRows > 0) {
                try {
                    const logChannel = await interaction.guild.channels.fetch('1395677255333707796').catch(() => null);
                    if (logChannel) {
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
                        }).catch(() => {});
                    }
                } catch (error) {
                    console.error('Logging fehlgeschlagen:', error);
                }
            }

        } catch (error) {
            console.error('Datenbankfehler:', error);
            await interaction.editReply({
                content: 'Ein schwerwiegender Fehler ist aufgetreten. Bitte versuche es später erneut.'
            });
        }
    }
};