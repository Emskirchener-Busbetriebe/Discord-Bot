const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Antwortet mit einem Ping-Embed!'),
  async execute(interaction) {
    const serverName = interaction.guild.name;
    const latency = Math.abs(Date.now() - interaction.createdTimestamp);
    const embed = new EmbedBuilder()
        .setTitle(`Pong mit ${latency}ms!`)
        .setColor('Green')
        .setFooter({ text: `${serverName} | Bot`, iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
