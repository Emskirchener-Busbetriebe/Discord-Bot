const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { readFile, writeFile } = require('fs').promises;
const { join } = require('path');
const { setTimeout } = require('timers/promises');

const shiftsPath = join(__dirname, 'shifts.json');
const MAIN_GUILD = "1104669016565489675";
const NOTIFICATION_USER = "923585143912955994";
const LOG_CHANNEL = "1350865603799420999";

async function readShifts() {
    try {
        const data = await readFile(shiftsPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

async function writeShifts(data) {
    await writeFile(shiftsPath, JSON.stringify(data, null, 2));
}

async function scheduleAllShifts(client) {
    const shiftsData = await readShifts();
    for (const [guildId, guildData] of Object.entries(shiftsData)) {
        for (const shift of guildData.shifts) {
            scheduleShiftStart(client, shift, guildId);
        }
    }
}

async function scheduleShiftStart(client, shift, guildId) {
    try {
        const startTime = new Date(`${shift.date}T${shift.time}:00`);
        const now = Date.now();

        if (startTime > now) {
            const timeout = startTime - now;
            setTimeout(timeout).then(async () => {
                const shiftsData = await readShifts();
                const guildShifts = shiftsData[guildId]?.shifts || [];
                const currentShift = guildShifts.find(s => s.id === shift.id);

                if (!currentShift?.channelId) return;

                const channel = await client.channels.fetch(currentShift.channelId).catch(console.error);
                if (!channel) return;

                const participants = currentShift.participants.length > 0
                    ? currentShift.participants.map(p => `<@${p.userId}>`).join('\n')
                    : 'Keine Teilnehmer';

                const startTimestamp = Math.floor(startTime.getTime() / 1000);
                const embed = new EmbedBuilder()
                    .setTitle('Schicht startet jetzt')
                    .setDescription(`**Startzeit:** <t:${startTimestamp}:F>`)
                    .addFields({ name: 'Teilnehmer', value: participants })
                    .setColor(0xFFA500)
                    .setFooter({
                        text: `${channel.guild.name} | Bot`,
                        iconURL: client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                await channel.send({ embeds: [embed] });

                for (const participant of currentShift.participants) {
                    try {
                        const user = await client.users.fetch(participant.userId);
                        await user.send({
                            content: `Die Schicht am ${currentShift.date} um ${currentShift.time} startet jetzt!`,
                            embeds: [embed]
                        });
                    } catch (error) {
                        console.error(`DM Fehler an ${participant.userId}:`, error.message);
                    }
                }

                const endTime = new Date(startTime.getTime() + currentShift.duration * 60 * 60 * 1000);
                const endTimeout = endTime - startTime;

                setTimeout(endTimeout).then(async () => {
                    const shiftsData = await readShifts();
                    const guildShifts = shiftsData[guildId]?.shifts || [];
                    const index = guildShifts.findIndex(s => s.id === shift.id);

                    if (index !== -1) {
                        guildShifts.splice(index, 1);
                        await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                        const endTimestamp = Math.floor(endTime.getTime() / 1000);
                        const endEmbed = new EmbedBuilder()
                            .setTitle('Schicht endet jetzt')
                            .setDescription(`**Endzeit:** <t:${endTimestamp}:F>`)
                            .addFields({ name: 'Teilnehmer', value: participants })
                            .setColor(0xFF0000)
                            .setFooter({
                                text: `${channel.guild.name} | Bot`,
                                iconURL: client.user.displayAvatarURL()
                            })
                            .setTimestamp();

                        await channel.send({ embeds: [endEmbed] });

                        for (const participant of currentShift.participants) {
                            try {
                                const user = await client.users.fetch(participant.userId);
                                await user.send({
                                    content: `Die Schicht am ${currentShift.date} um ${currentShift.time} endet jetzt!`,
                                    embeds: [endEmbed]
                                });
                            } catch (error) {
                                console.error(`DM Fehler an ${participant.userId}:`, error.message);
                            }
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error('Fehler bei Schichtstart:', error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shift')
        .setDescription('Verwalte Schichten')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Neue Schicht erstellen (Admin)')
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Datum (YYYY-MM-DD)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Uhrzeit (HH:MM)')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('Dauer der Schicht in Stunden')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('max')
                        .setDescription('Maximale Teilnehmer')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Schicht löschen (Admin)')
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Datum (YYYY-MM-DD)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Uhrzeit (HH:MM)')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('join')
                .setDescription('Schicht beitreten')
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Datum (YYYY-MM-DD)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Uhrzeit (HH:MM)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('bus')
                        .setDescription('Wähle einen Bus')
                        .setRequired(true)
                        .addChoices(
                            { name: 'MAN Lion\'s City 1000 rot (EM VG 101)', value: 'EM VG 101' },
                            { name: 'MAN Lion\'s City 1000 rot (EM VG 102)', value: 'EM VG 102' },
                            { name: 'MAN Lion\'s City 1000 rot (EM VG 103)', value: 'EM VG 103' },
                            { name: 'MAN Lion\'s City 1000 rot (EM VG 104)', value: 'EM VG 104' },
                            { name: 'MAN Lion\'s City 1000 Feuerwehr (EM VG 125)', value: 'EM VG 125' },
                            { name: 'MAN Lion\'s City 1000 Rewe (EM VG 136)', value: 'EM VG 136' },
                            { name: 'MAN Lion\'s City 1000 Silvester (EM VG 197)', value: 'EM VG 197' },
                            { name: 'Iveco Crossway LE (105)', value: '105' }
                        ))
                .addStringOption(option =>
                    option.setName('line')
                        .setDescription('Wähle eine Linie')
                        .setRequired(true)
                        .addChoices(
                            { name: '132 (Altschauernberg Feuerwehr ↔ Emskirchen Bahnhof)', value: '132' },
                            { name: '61 (ZOB Emskirchen ↔ Wulkersdorfer Straße)', value: '61' },
                            { name: '64 (Emskirchen Festplatz ↔ Wulkersdorfer Straße)', value: '64' }
                        ))
                .addStringOption(option =>
                    option.setName('role')
                        .setDescription('Wähle deine Rolle')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Supervisor', value: 'Supervisor' },
                            { name: 'Developer', value: 'Developer' },
                            { name: 'Busfahrer', value: 'Busfahrer' },
                            { name: 'Fahrgast', value: 'Fahrgast' }
                        ))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leave')
                .setDescription('Schicht verlassen')
                .addStringOption(option =>
                    option.setName('date')
                        .setDescription('Datum (YYYY-MM-DD)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Uhrzeit (HH:MM)')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Alle Schichten anzeigen')
        ),
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Eine Shift bearbeiten')
        ),

    async execute(interaction) {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: 'Dieser Befehl kann nur auf Servern verwendet werden.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const now = new Date();
        const guildId = interaction.guildId;

        try {
            const shiftsData = await readShifts();
            let guildShifts = shiftsData[guildId]?.shifts || [];

            switch (subcommand) {
                case 'add': {
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return interaction.reply({ content: 'Nur Admins können Schichten erstellen!', ephemeral: true });
                    }

                    const date = interaction.options.getString('date');
                    const time = interaction.options.getString('time');
                    const duration = interaction.options.getInteger('duration');
                    const max = interaction.options.getInteger('max');

                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        return interaction.reply({ content: 'Ungültiges Datumsformat! Verwende YYYY-MM-DD.', ephemeral: true });
                    }
                    const dateObj = new Date(date);
                    if (isNaN(dateObj.getTime())) {
                        return interaction.reply({ content: 'Ungültiges Datum!', ephemeral: true });
                    }

                    if (!/^\d{2}:\d{2}$/.test(time)) {
                        return interaction.reply({ content: 'Ungültiges Zeitformat! Verwende HH:MM.', ephemeral: true });
                    }
                    const [hours, minutes] = time.split(':').map(Number);
                    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                        return interaction.reply({ content: 'Ungültige Uhrzeit!', ephemeral: true });
                    }

                    if (duration <= 0) {
                        return interaction.reply({ content: 'Ungültige Dauer! Die Dauer muss mindestens 1 Stunde betragen.', ephemeral: true });
                    }

                    if (max <= 0) {
                        return interaction.reply({ content: 'Ungültige Teilnehmer Anzahl!', ephemeral: true });
                    }

                    const startTime = new Date(`${date}T${time}:00`);
                    if (startTime <= new Date()) {
                        return interaction.reply({ content: 'Die Schicht muss in der Zukunft liegen!', ephemeral: true });
                    }

                    if (guildShifts.some(s => s.date === date && s.time === time)) {
                        return interaction.reply({ content: 'Es existiert bereits eine Schicht zu dieser Zeit!', ephemeral: true });
                    }

                    const newShift = {
                        id: Date.now().toString(),
                        date,
                        time,
                        duration, // Dauer in Stunden
                        maxMembers: max,
                        participants: [],
                        channelId: interaction.channelId
                    };

                    guildShifts.push(newShift);
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    scheduleShiftStart(interaction.client, newShift, guildId);

                    const startTimestamp = Math.floor(startTime.getTime() / 1000);
                    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
                    const endTimestamp = Math.floor(endTime.getTime() / 1000);

                    const adEmbed = new EmbedBuilder()
                        .setTitle('Neue Schicht verfügbar')
                        .setDescription('Nutze `/shift join`, um dieser Schicht beizutreten!')
                        .addFields(
                            { name: 'Datum', value: date, inline: true },
                            { name: 'Uhrzeit', value: time, inline: true },
                            { name: 'Dauer', value: `${duration} Stunden`, inline: true },
                            { name: 'Maximale Teilnehmer', value: `${max} Personen`, inline: false },
                            { name: 'Startzeit', value: `<t:${startTimestamp}:F>`, inline: false },
                            { name: 'Endzeit', value: `<t:${endTimestamp}:F>`, inline: false }
                        )
                        .setColor(0x00FF00)
                        .setFooter({
                            text: `${interaction.guild.name} | Bot`,
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [adEmbed] });
                    break;
                }

                case 'join': {
                    const date = interaction.options.getString('date');
                    const time = interaction.options.getString('time');
                    const startTime = new Date(`${date}T${time}:00`);

                    if (startTime < now) {
                        return interaction.reply({
                            content: 'Diese Schicht hat bereits begonnen!',
                            ephemeral: true
                        });
                    }

                    const bus = interaction.options.getString('bus');
                    const line = interaction.options.getString('line');
                    const role = interaction.options.getString('role');
                    const userId = interaction.user.id;

                    const shift = guildShifts.find(s => s.date === date && s.time === time);

                    if (!shift) {
                        return interaction.reply({ content: 'Schicht nicht gefunden!', ephemeral: true });
                    }

                    if (shift.participants.some(p => p.userId === userId)) {
                        return interaction.reply({ content: 'Du bist bereits in dieser Schicht!', ephemeral: true });
                    }

                    if (shift.participants.length >= shift.maxMembers) {
                        return interaction.reply({ content: 'Diese Schicht ist bereits voll!', ephemeral: true });
                    }

                    if (role === 'Supervisor') {
                        const member = interaction.member;
                        if (!member.roles.cache.has('1292478179495379017')) {
                            return interaction.reply({
                                content: 'Du bist kein Supervisor! Fehlende Berechtigung.',
                                ephemeral: true
                            });
                        }

                        const supervisorCount = shift.participants.filter(p => p.role === 'Supervisor').length;
                        if (supervisorCount >= 3) {
                            return interaction.reply({
                                content: 'Es können maximal 3 Supervisor pro Schicht teilnehmen!',
                                ephemeral: true
                            });
                        }
                    }

                    shift.participants.push({ userId, bus, line, role });
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    if (interaction.guildId === MAIN_GUILD) {
                        try {
                            const targetUser = await interaction.client.users.fetch(NOTIFICATION_USER);
                            const participant = interaction.member;

                            const dmEmbed = new EmbedBuilder()
                                .setTitle('Neue Schichtanmeldung')
                                .setDescription(`${participant} hat sich für eine Schicht angemeldet`)
                                .addFields(
                                    { name: 'Datum', value: date, inline: true },
                                    { name: 'Uhrzeit', value: time, inline: true },
                                    { name: 'Bus', value: bus, inline: true },
                                    { name: 'Linie', value: line, inline: true },
                                    { name: 'Rolle', value: role, inline: true }
                                )
                                .setColor(0x00FF00)
                                .setTimestamp();

                            await targetUser.send({ embeds: [dmEmbed] });

                            const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL);

                            const channelEmbed = new EmbedBuilder()
                                .setTitle('Neue Schichtanmeldung')
                                .setDescription(`<@${userId}> hat sich angemeldet`)
                                .addFields(
                                    { name: 'Datum', value: date, inline: true },
                                    { name: 'Uhrzeit', value: time, inline: true },
                                    { name: 'Bus', value: bus, inline: true },
                                    { name: 'Linie', value: line, inline: true },
                                    { name: 'Rolle', value: role, inline: true }
                                )
                                .setColor(0x00FF00)
                                .setFooter({
                                    text: interaction.guild.name,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp();

                            await logChannel.send({ embeds: [channelEmbed] });
                        } catch (error) {
                            console.error('Benachrichtigungsfehler:', error);
                        }
                    }

                    return interaction.reply({
                        content: `Du bist der Schicht am ${date} um ${time} erfolgreich beigetreten!\n**Bus:** ${bus}\n**Linie:** ${line}\n**Rolle:** ${role}`,
                        ephemeral: true
                    });
                }

                case 'list': {
                    guildShifts.sort((a, b) => {
                        const dateA = new Date(`${a.date}T${a.time}:00`);
                        const dateB = new Date(`${b.date}T${b.time}:00`);
                        return dateA - dateB;
                    });

                    const embeds = [];
                    for (const shift of guildShifts) {
                        const startTime = new Date(`${shift.date}T${shift.time}:00`);
                        const endTime = new Date(startTime.getTime() + shift.duration * 60 * 60 * 1000);
                        const status = startTime < now ? ' (bereits vorbei)' : '';
                        const startTimestamp = Math.floor(startTime.getTime() / 1000);
                        const endTimestamp = Math.floor(endTime.getTime() / 1000);

                        const embed = new EmbedBuilder()
                            .setTitle(`Schicht am ${shift.date} um ${shift.time}${status}`)
                            .addFields(
                                { name: 'Dauer', value: `${shift.duration} Stunden`, inline: true },
                                { name: 'Maximale Teilnehmer', value: shift.maxMembers.toString(), inline: true },
                                { name: 'Belegte Plätze', value: shift.participants.length.toString(), inline: true },
                                { name: 'Startzeit', value: `<t:${startTimestamp}:F>`, inline: false },
                                { name: 'Endzeit', value: `<t:${endTimestamp}:F>`, inline: false },
                                {
                                    name: 'Teilnehmer',
                                    value: shift.participants.length > 0
                                        ? shift.participants.map(p => `• <@${p.userId}> (${p.bus} | Linie ${p.line} | ${p.role})`).join('\n')
                                        : 'Keine Teilnehmer',
                                    inline: false
                                }
                            )
                            .setColor(startTime < now ? 0x555555 : 0x0099FF)
                            .setFooter({
                                text: `${interaction.guild.name} | Bot`,
                                iconURL: interaction.client.user.displayAvatarURL()
                            })
                            .setTimestamp(startTime);

                        embeds.push(embed);
                    }

                    return interaction.reply({
                        content: guildShifts.length > 0 ? '**Aktive Schichten:**' : 'Keine Schichten vorhanden',
                        embeds: embeds
                    });
                }

                case 'delete': {
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return interaction.reply({ content: 'Nur Admins können Schichten löschen!', ephemeral: true });
                    }

                    const date = interaction.options.getString('date');
                    const time = interaction.options.getString('time');

                    const index = guildShifts.findIndex(s => s.date === date && s.time === time);

                    if (index === -1) {
                        return interaction.reply({ content: 'Schicht nicht gefunden!', ephemeral: true });
                    }

                    guildShifts.splice(index, 1);
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    return interaction.reply({
                        content: `Schicht am ${date} um ${time} wurde gelöscht!`,
                        ephemeral: true
                    });
                }

                case 'leave': {
                    const date = interaction.options.getString('date');
                    const time = interaction.options.getString('time');
                    const userId = interaction.user.id;

                    const shift = guildShifts.find(s => s.date === date && s.time === time);

                    if (!shift) {
                        return interaction.reply({ content: 'Schicht nicht gefunden!', ephemeral: true });
                    }

                    const participantIndex = shift.participants.findIndex(p => p.userId === userId);
                    if (participantIndex === -1) {
                        return interaction.reply({ content: 'Du bist nicht in dieser Schicht!', ephemeral: true });
                    }

                    const participantData = shift.participants[participantIndex];

                    shift.participants.splice(participantIndex, 1);
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    if (interaction.guildId === MAIN_GUILD) {
                        try {
                            const targetUser = await interaction.client.users.fetch(NOTIFICATION_USER);
                            const participant = interaction.member;

                            const dmEmbed = new EmbedBuilder()
                                .setTitle('Schicht verlassen')
                                .setDescription(`${participant} hat eine Schicht verlassen`)
                                .addFields(
                                    { name: 'Datum', value: date, inline: true },
                                    { name: 'Uhrzeit', value: time, inline: true },
                                    { name: 'Bus', value: participantData.bus, inline: true },
                                    { name: 'Linie', value: participantData.line, inline: true },
                                    { name: 'Rolle', value: participantData.role, inline: true }
                                )
                                .setColor(0xFF0000)
                                .setTimestamp();

                            await targetUser.send({ embeds: [dmEmbed] });

                            const logChannel = await interaction.client.channels.fetch(LOG_CHANNEL);

                            const channelEmbed = new EmbedBuilder()
                                .setTitle('Schicht verlassen')
                                .setDescription(`<@${userId}> hat die Schicht verlassen`)
                                .addFields(
                                    { name: 'Datum', value: date, inline: true },
                                    { name: 'Uhrzeit', value: time, inline: true },
                                    { name: 'Bus', value: participantData.bus, inline: true },
                                    { name: 'Linie', value: participantData.line, inline: true },
                                    { name: 'Rolle', value: participantData.role, inline: true }
                                )
                                .setColor(0xFF0000)
                                .setFooter({
                                    text: interaction.guild.name,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp();

                            await logChannel.send({ embeds: [channelEmbed] });
                        } catch (error) {
                            console.error('Benachrichtigungsfehler beim Verlassen:', error);
                        }
                    }
                case 'add': {
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return interaction.reply({ content: 'Nur Admins können Schichten bearbeiten!', ephemeral: true });
                    }

                    const date = interaction.options.getString('date');
                    const time = interaction.options.getString('time');
                    const duration = interaction.options.getInteger('duration');
                    const max = interaction.options.getInteger('max');

                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        return interaction.reply({ content: 'Ungültiges Datumsformat! Verwende YYYY-MM-DD.', ephemeral: true });
                    }
                    const dateObj = new Date(date);
                    if (isNaN(dateObj.getTime())) {
                        return interaction.reply({ content: 'Ungültiges Datum!', ephemeral: true });
                    }

                    if (!/^\d{2}:\d{2}$/.test(time)) {
                        return interaction.reply({ content: 'Ungültiges Zeitformat! Verwende HH:MM.', ephemeral: true });
                    }
                    const [hours, minutes] = time.split(':').map(Number);
                    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                        return interaction.reply({ content: 'Ungültige Uhrzeit!', ephemeral: true });
                    }

                    if (duration <= 0) {
                        return interaction.reply({ content: 'Ungültige Dauer! Die Dauer muss mindestens 1 Stunde betragen.', ephemeral: true });
                    }

                    if (max <= 0) {
                        return interaction.reply({ content: 'Ungültige Teilnehmer Anzahl!', ephemeral: true });
                    }

                    const startTime = new Date(`${date}T${time}:00`);
                    if (startTime <= new Date()) {
                        return interaction.reply({ content: 'Die Schicht muss in der Zukunft liegen!', ephemeral: true });
                    }

                    if (guildShifts.some(s => s.date === date && s.time === time)) {
                        return interaction.reply({ content: 'Es existiert bereits eine Schicht zu dieser Zeit!', ephemeral: true });
                    }

                    const newShift = {
                        id: Date.now().toString(),
                        date,
                        time,
                        duration, // Dauer in Stunden
                        maxMembers: max,
                        participants: [],
                        channelId: interaction.channelId
                    };

                    guildShifts.push(newShift);
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    scheduleShiftStart(interaction.client, newShift, guildId);

                    const startTimestamp = Math.floor(startTime.getTime() / 1000);
                    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
                    const endTimestamp = Math.floor(endTime.getTime() / 1000);

                    const adEmbed = new EmbedBuilder()
                        .setTitle('Bearbeitete Schicht verfügbar')
                        .setDescription('Nutze `/shift join`, um dieser Schicht beizutreten!')
                        .addFields(
                            { name: 'Datum', value: date, inline: true },
                            { name: 'Uhrzeit', value: time, inline: true },
                            { name: 'Dauer', value: `${duration} Stunden`, inline: true },
                            { name: 'Maximale Teilnehmer', value: `${max} Personen`, inline: false },
                            { name: 'Startzeit', value: `<t:${startTimestamp}:F>`, inline: false },
                            { name: 'Endzeit', value: `<t:${endTimestamp}:F>`, inline: false }
                        )
                        .setColor(0x00FF00)
                        .setFooter({
                            text: `${interaction.guild.name} | Bot`,
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();

                    await interaction.reply({ embeds: [adEmbed] });
                    break;
                }
                    
                    return interaction.reply({
                        content: `Du hast die Schicht am ${date} um ${time} verlassen!`,
                        ephemeral: true
                    });
                }
            }
        } catch (error) {
            console.error('Shift Command Error:', error);
            return interaction.reply({
                content: 'Ein Fehler ist aufgetreten!',
                ephemeral: true
            });
        }
    },

    async init(client) {
        scheduleAllShifts(client);
        console.log('Shift-System initialisiert');
    }
};
