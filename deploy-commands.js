const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Überprüfen, ob 'data' existiert und gültig ist
    if (command.data) {
        commands.push(command.data.toJSON());
    } else {
        console.error(`Fehler: Kommando in Datei ${filePath} hat keine gültige "data"-Eigenschaft.`);
    }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Starte die Synchronisation der Slash-Commands...');

        // Holen der aktuellen registrierten Commands
        const currentCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));

        const commandsToRemove = currentCommands.filter(cmd => !commands.some(c => c.name === cmd.name));

        // Entfernen von nicht mehr benötigten Commands
        for (const cmd of commandsToRemove) {
            await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, cmd.id));
            console.log(`Entfernt: ${cmd.name}`);
        }

        // Registrieren neuer Commands
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('Slash-Commands erfolgreich registriert!');
    } catch (error) {
        console.error('Fehler bei der Synchronisation der Slash-Commands:', error);
    }
})();
