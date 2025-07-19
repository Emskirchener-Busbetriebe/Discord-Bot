const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserWarns } = require('./warn');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Zeigt alle Warns eines Users an')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Der User, dessen Warns angezeigt werden sollen')
                .setRequired(true)),

    execute: async (interaction) => {
        await interaction.deferReply();

        try {
            const user = interaction.options.getUser('user');
            let warns = await getUserWarns(user.id);

            if (warns.length === 0) {
                await interaction.editReply({ content: `${user.tag} hat keine Warns.` });
                return;
            }

            warns = warns.sort((a, b) => a.warncount - b.warncount);

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle(`⚠️ Warns für ${user.tag}`)
                .setDescription(`**Insgesamt:** ${warns.length} Warn(s)`);

            warns.forEach(warn => {
                let datePart, timePart;

                if (warn.timestamp) {
                    const dateObj = new Date(warn.timestamp);
                    datePart = dateObj.toISOString().split('T')[0];
                    timePart = dateObj.toTimeString().substring(0, 8);
                } else {
                    datePart = warn.date instanceof Date ? warn.date.toISOString().split('T')[0] : warn.date;
                    timePart = warn.time || '00:00:00';
                }

                const [year, month, day] = datePart.split('-');
                const [hours, minutes] = timePart.split(':');

                const warnDate = new Date(
                    parseInt(year),
                    parseInt(month) - 1,
                    parseInt(day),
                    parseInt(hours),
                    parseInt(minutes)
                );

                const formattedDate = warnDate.toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).replace(',', '');

                embed.addFields({
                    name: `Warn #${warn.warncount}`,
                    value: `**Grund:** ${warn.reason}\n**Datum:** ${formattedDate} Uhr`,
                    inline: false
                });
            });

            embed.setFooter({
                text: `Emskirchener Busbetriebe | Bot`,
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await interaction.editReply({
                content: 'Fehler beim Abrufen der Warns. Bitte versuche es später erneut.'
            });
            console.error('Fehler in warnings:', error);
        }
    }
};