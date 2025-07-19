# Emskirchener-Busbetriebe Discord-Bot | Beta 1.2.2
Der offizielle Discord-Bot für den Emskirchener-Busbetriebe Discord-Server.  
[Link zum Server](https://discord.gg/4mNHuCKUjR)

**Version:** Beta 1.2.2!!!


## Commands

- **Ping Slash Command**: Ein einfacher `/ping`-Befehl, der mit der aktuellen Latenz in Millisekunden antwortet.
---
- **Shutdown Slash Command**: Der `/shutdown`-Befehl, fährt den Bot herunter, dieser Befehl kann nur vom Owner des Bots ausgeführt werden!
---
- **Zitat Slash Command**: Mit dem `/quote`-Befehl, zeigt der Bot ein zufällig Zitat mithilfe der [zenquotes.io](https://zenquotes.io)-API an.
---
- **Meme Slash Command**:`/meme` Mit diesem Befehl, zeigt der Bot ein zufällig Meme aus mithilfe [Meme-API](https://github.com/D3vd/Meme_Api) an.
---
- **Uptime Slash Command**: Ein simpler `/uptime`-Befehl, welcher dir die Laufzeit des Discord Bots anzeigt.
---
- **Clear Slash Command**: `/clear`, löscht eine bestimmte Anzahl von Narichten in einem Kanal.
---
- **Activity set Slash Command**: `/activity set`, Setz eine bestimmte Aktivität, auf Wunsch mit Zeitspanne, nach ablauf der Zeitspanne wird die Aktivität, aus der JSON geladen.
---
- **Activty delete Slash Command**: `/activty delete`, löscht den aktuellen Status des Bot´s und lädt den Standart Status aus der JSON.
---
- **Warn Slash Command**: `/warn`, Warnt einen User und sendet eine Naricht in den Log Channel.
---
- **Activty delete Slash Command**: `/warnings`, Listet die Warns eines Users in einem Embed auf.
---

## Weitere Funktionen

- **Willkommens Naricht**: Sobald ein neuer Member dem Server joint wird im Willkommens-Kanal ein Embed gesendet 
---
- Das **Shift-System** des Discord-Bots enthält einige Befehle, dazu zählen:

  `/shift add`: Mit diesem Befehl legt ein Admin Datum, Uhrzeit sowie die maximale Teilnehmeranzahl für eine Schicht fest. Der Bot antwortet mit einem Embed, das für alle zugänglich ist und die Informationen auflistet.

  `/shift delete`: Damit können erstellte Schichten wieder gelöscht werden. Dazu benötigt man das Datum sowie die Uhrzeit der Schicht.

  `/shift edit`: Bereits erstellte Schichten können einfach bearbeitet werden.

  `/shift list`: Listet alle Schichten auf, die im System vorhanden sind, inklusive der Teilnehmer. Schichten werden 2 Stunden nach Beginn der jeweiligen Schicht automatisch gelöscht.

  `/shift join`: Damit kann ein Mitglied einer Schicht beitreten. Dazu benötigt es das Datum sowie die Uhrzeit der Schicht. Zusätzlich wird der Benutzer nach dem Bus ,der Linie gefragt, die er fahren möchte und welche Rolle er machen möchte. Diese werden automatisch vorgeschlagen.

   `/shift leave`: Der User kann damit eine Schicht wieder verlassen. Dazu benötigt er lediglich das Datum sowie die Uhrzeit der jeweiligen Schicht.
  
---
## Weiterentwicklung
- **Neue Funktionen oder Bugs**: Im Issues Tab dieser Repository
---
## Installation [Für das Emskirchener-Busbetriebe Team!!!]

1. Klone das Repository:
   ```bash
   git clone https://github.com/Emskirchener-Busbetriebe/Discord-Bot.git
2. Installiere die benötigten Packete:
   ```bash
   npm install
   npm install axios

3. Erstelle eine .env-Datei im Hauptverzeichnis und füge den Bot-Token und die ClientID ein. (Frage Leon nach den Daten.)
   ```bash
   TOKEN="Token(mit ")"
   CLIENT_ID="Client ID(mit ")"
4. Bot starten:
   ```bash
   node index.js

#### By Leon.H43/Gamer443 with ❤️
