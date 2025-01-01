const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support-roles')
        .setDescription('Support-Rollen für Ihren Server festlegen.')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Die Rolle, die als Support-Rolle hinzugefügt werden soll.')
                .setRequired(true)),
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        const rolesFilePath = path.join(__dirname, '..', 'json', 'supportRoles.json');
        let rolesData = {};

        if (fs.existsSync(rolesFilePath)) {
            rolesData = JSON.parse(fs.readFileSync(rolesFilePath, 'utf8'));
        }

        if (!rolesData[guildId]) {
            rolesData[guildId] = [];
        }

        rolesData[guildId].push(role.id);

        fs.writeFileSync(rolesFilePath, JSON.stringify(rolesData, null, 2));

        await interaction.reply(`Die Rolle ${role.name} wurde als Support-Rolle hinzugefügt.`);
    }
};
