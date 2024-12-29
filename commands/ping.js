const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Antwortet mit einem Ping-Embed!'),
  async execute(interaction) {
    const latency = Math.abs(Date.now() - interaction.createdTimestamp);
    const embed = new EmbedBuilder()
        .setTitle(`Pong mit ${latency}ms!`)
        .setColor('Green');

    await interaction.reply({ embeds: [embed] });
  }
};
