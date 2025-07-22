const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Wähle deinen Starter-Pokémon!'),

    async execute(interaction) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('starter')
            .setPlaceholder('Wähle ein Pokémon!')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Bisasam')
                    .setDescription('Pflanze/Gift-Typ.')
                    .setValue('bulbasaur'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Glumanda')
                    .setDescription('Feuer-Typ.')
                    .setValue('charmander'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Schiggy')
                    .setDescription('Wasser-Typ.')
                    .setValue('squirtle')
            );

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({
            content: 'Wähle deinen Starter:',
            components: [row],
        });
    },
};
