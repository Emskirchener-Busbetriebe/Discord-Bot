const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, Colors } = require('discord.js');
const fs = require('fs');
const path = require('path');

const rolesFilePath = path.join(__dirname, '..', 'json', 'supportRoles.json');

function loadRoles() {
    if (fs.existsSync(rolesFilePath)) {
        return JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
    }
    return {};
}

function saveRoles(data) {
    fs.writeFileSync(rolesFilePath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support-roles')
        .setDescription('Verwalte Support-Rollen auf deinem Server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Füge eine neue Support-Rolle hinzu.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Die Rolle, die hinzugefügt werden soll.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Zeigt alle Support-Rollen des Servers an.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Entfernt eine Support-Rolle.')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Die Rolle, die entfernt werden soll.')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        const serverName = interaction.guild.name;
        let rolesData = loadRoles();

        if (!rolesData[guildId]) {
            rolesData[guildId] = [];
        }

        const timestamp = Date.now();

        if (subcommand === 'add') {
            const role = interaction.options.getRole('role');
            if (!rolesData[guildId].includes(role.id)) {
                rolesData[guildId].push(role.id);
                saveRoles(rolesData);

                const embed = new EmbedBuilder()
                    .setColor(Colors.Green)
                    .setTitle('Support-Rolle hinzugefügt')
                    .setDescription(`Die Rolle ➦ **${role.name}** wurde erfolgreich als Support-Rolle hinzugefügt. ${role.toString()}`)
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp(timestamp);
                await interaction.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle('Fehler')
                    .setDescription(`Die Rolle **${role.name}** ist bereits als Support-Rolle eingetragen.`)
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp(timestamp);
                await interaction.reply({ embeds: [embed] });
            }
        }

        if (subcommand === 'list') {
            const roleIds = rolesData[guildId] || [];
            if (roleIds.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Yellow)
                    .setTitle('Keine Support-Rollen')
                    .setDescription('Es wurden noch keine Support-Rollen festgelegt.')
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp(timestamp);
                await interaction.reply({ embeds: [embed] });
                return;
            }
            const roles = roleIds.map(id => `<@&${id}>`).join(', ');
            const embed = new EmbedBuilder()
                .setColor(Colors.Blue)
                .setTitle('Support-Rollen')
                .setDescription(`Die folgenden Rollen sind als Support-Rollen festgelegt:\n${roles}`)
                .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp(timestamp);
            await interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'remove') {
            const role = interaction.options.getRole('role');
            if (!rolesData[guildId] || !rolesData[guildId].includes(role.id)) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.Red)
                    .setTitle('Fehler')
                    .setDescription(`Die Rolle **${role.name}** ist keine eingetragene Support-Rolle.`)
                    .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp(timestamp);
                await interaction.reply({ embeds: [embed] });
                return;
            }

            rolesData[guildId] = rolesData[guildId].filter(id => id !== role.id);
            saveRoles(rolesData);

            const embed = new EmbedBuilder()
                .setColor(Colors.Red)
                .setTitle('Support-Rolle entfernt')
                .setDescription(`Die Rolle ➦ **${role.name}** wurde als Support-Rolle entfernt. ${role.toString()}`)
                .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp(timestamp);
            await interaction.reply({ embeds: [embed] });
        }
    }
};
