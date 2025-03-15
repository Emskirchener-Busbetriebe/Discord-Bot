const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { mainGuild } = require('../config/config.json');

let db;
(async () => {
    db = await open({
        filename: './betaKeys.db',
        driver: sqlite3.Database
    });
    await db.run(`CREATE TABLE IF NOT EXISTS testers (id TEXT PRIMARY KEY, key TEXT)`);
    await db.run(`CREATE TABLE IF NOT EXISTS config (name TEXT PRIMARY KEY, value INTEGER)`);
})();

function generateKey() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Beta-Management-Befehle')
        .addSubcommand(cmd => cmd
            .setName('add')
            .setDescription('Fügt einen Beta-Tester hinzu.')
            .addUserOption(option => option.setName('user').setDescription('Benutzer zum Hinzufügen').setRequired(true)))
        .addSubcommand(cmd => cmd
            .setName('remove')
            .setDescription('Entfernt einen Beta-Tester.')
            .addUserOption(option => option.setName('user').setDescription('Benutzer zum Entfernen').setRequired(true)))
        .addSubcommand(cmd => cmd
            .setName('limit')
            .setDescription('Setzt das Beta-Limit.')
            .addIntegerOption(option => option.setName('anzahl').setDescription('Maximale Anzahl an Testern').setRequired(true)))
        .addSubcommand(cmd => cmd
            .setName('list')
            .setDescription('Zeigt alle aktuellen Beta-Tester an.')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');
        const limit = interaction.options.getInteger('anzahl');

        const isMainGuild = interaction.guild && interaction.guild.id === mainGuild;
        const isAdmin = interaction.member?.permissions.has(PermissionsBitField.Flags.Administrator);

        if (['add', 'remove', 'limit'].includes(subcommand)) {
            if (!isMainGuild || !isAdmin) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Keine Berechtigung')
                    .setDescription('Dieser Befehl kann nur von Admins auf dem Emskirchener Busbetriebe Discord ausgeführt werden.')
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed], ephemeral: true });
                return;
            }
        }

        if (subcommand === 'add') {
            const count = await db.get(`SELECT COUNT(*) as total FROM testers`);
            const config = await db.get(`SELECT value FROM config WHERE name = 'limit'`);

            if (config && count.total >= config.value) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Beta Limit erreicht')
                    .setDescription('Die Beta ist bereits voll.')
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const existing = await db.get(`SELECT * FROM testers WHERE id = ?`, user.id);
            if (existing) {
                const embed = new EmbedBuilder()
                    .setColor('#FFFF00')
                    .setTitle('Bereits Beta-Tester')
                    .setDescription(`${user.tag} ist bereits ein Beta-Tester.`)
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const key = generateKey();
            await db.run(`INSERT INTO testers (id, key) VALUES (?, ?)`, [user.id, key]);
            try {
                await user.send(`Willkommen als Beta-Tester! Dein Key: **${key}**`);
            } catch {
                const embed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle('Fehler beim Senden der DM')
                    .setDescription(`${user.tag} wurde hinzugefügt, aber die DM konnte nicht zugestellt werden.`)
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Beta-Tester hinzugefügt')
                .setDescription(`${user.tag} wurde als Beta-Tester hinzugefügt.`)
                .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            await db.run(`DELETE FROM testers WHERE id = ?`, user.id);
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Beta-Tester entfernt')
                .setDescription(`${user.tag} wurde als Beta-Tester entfernt.`)
                .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'limit') {
            await db.run(`INSERT OR REPLACE INTO config (name, value) VALUES ('limit', ?)`, limit);
            const embed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('Beta-Limit gesetzt')
                .setDescription(`Das Beta-Limit wurde auf ${limit} gesetzt.`)
                .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'list') {
            const testers = await db.all(`SELECT id FROM testers`);
            if (testers.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('Keine Beta-Tester')
                    .setDescription('Es gibt derzeit keine Beta-Tester.')
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                return;
            }

            const testerList = testers.map(t => `• <@${t.id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Aktuelle Beta-Tester')
                .setDescription(testerList)
                .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
