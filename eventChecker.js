const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    function checkEvents() {
        const now = new Date();
        const eventsPath = path.join(__dirname, 'commands', 'shifts.json');

        if (!fs.existsSync(eventsPath)) {
            console.error('❌ Fehler: shifts.json nicht gefunden!');
            return;
        }

        const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

        // Alle Events durchgehen
        Object.values(events).forEach(eventData => {
            eventData.shifts.forEach(shift => {
                const shiftStart = new Date(`${shift.date}T${shift.time}:00Z`); // Datum & Zeit kombinieren

                // Prüfen, ob das Event jetzt startet
                if (now.toISOString().slice(0, 16) === shiftStart.toISOString().slice(0, 16)) {
                    const channel = client.channels.cache.get(shift.channelId);
                    if (channel) {
                        channel.send(`🚍 **Schichtbeginn!**  
                        📅 Datum: ${shift.date}  
                        ⏰ Uhrzeit: ${shift.time}  
                        🕒 Dauer: ${shift.duration} Stunden  
                        👥 Teilnehmer: ${shift.participants.length}  
                        `);
                    }
                }
            });
        });
    }

    // Alle 60 Sekunden prüfen
    setInterval(checkEvents, 60000);
};
