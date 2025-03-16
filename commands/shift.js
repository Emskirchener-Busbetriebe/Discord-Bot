const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { readFile, writeFile } = require('fs').promises;
const { join } = require('path');
const { setTimeout } = require('timers/promises');

const shiftsPath = join(__dirname, 'shifts.json');

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

                // Benachrichtigung im Channel
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

                // Persönliche Nachrichten
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

                // Lösche Schicht nach 2 Stunden
                setTimeout(7200000).then(async () => {
                    const shiftsData = await readShifts();
                    const guildShifts = shiftsData[guildId]?.shifts || [];
                    const index = guildShifts.findIndex(s => s.id === shift.id);

                    if (index !== -1) {
                        guildShifts.splice(index, 1);
                        await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });
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
                    const max = interaction.options.getInteger('max');

                    // Validierung
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                        return interaction.reply({ content: 'Ungültiges Datumsformat! Verwende YYYY-MM-DD.', ephemeral: true });
                    }
                    if (!/^\d{2}:\d{2}$/.test(time)) {
                        return interaction.reply({ content: 'Ungültiges Zeitformat! Verwende HH:MM.', ephemeral: true });
                    }

                    if (guildShifts.some(s => s.date === date && s.time === time)) {
                        return interaction.reply({ content: 'Es existiert bereits eine Schicht zu dieser Zeit!', ephemeral: true });
                    }

                    const newShift = {
                        id: Date.now().toString(),
                        date,
                        time,
                        maxMembers: max,
                        participants: [],
                        channelId: interaction.channelId
                    };

                    guildShifts.push(newShift);
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    scheduleShiftStart(interaction.client, newShift, guildId);

                    const startTimestamp = Math.floor(new Date(`${date}T${time}:00`).getTime() / 1000);
                    const adEmbed = new EmbedBuilder()
                        .setTitle('Neue Schicht verfügbar')
                        .addFields(
                            { name: 'Datum', value: date, inline: false },
                            { name: 'Uhrzeit', value: time, inline: false },
                            { name: 'Maxmimale Teilnehmer', value: `${max} Personen`, inline: false },
                            { name: 'Startzeit', value: `<t:${startTimestamp}:F>`, inline: false }
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

                    shift.participants.push({ userId, bus, line });
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

                    return interaction.reply({
                        content: `Du bist der Schicht am ${date} um ${time} erfolgreich beigetreten!\n**Bus:** ${bus}\n**Linie:** ${line}`,
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
                        const status = startTime < now ? ' (bereits vorbei)' : '';
                        const startTimestamp = Math.floor(startTime.getTime() / 1000);

                        const embed = new EmbedBuilder()
                            .setTitle(`Schicht am ${shift.date} um ${shift.time}${status}`)
                            .addFields(
                                { name: 'Maximale Teilnehmer', value: shift.maxMembers.toString(), inline: true },
                                { name: 'Belegte Plätze', value: shift.participants.length.toString(), inline: true },
                                { name: 'Startzeit', value: `<t:${startTimestamp}:F>`, inline: false },
                                {
                                    name: 'Teilnehmer',
                                    value: shift.participants.length > 0
                                        ? shift.participants.map(p => `• <@${p.userId}> (${p.bus} | Linie ${p.line})`).join('\n')
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

                    shift.participants.splice(participantIndex, 1);
                    await writeShifts({ ...shiftsData, [guildId]: { shifts: guildShifts } });

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