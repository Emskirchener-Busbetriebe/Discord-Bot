# Emskirchener-Busbetriebe Discord-Bot

Der offizielle Discord-Bot für den Emskirchener-Busbetriebe Discord-Server.  
[Link zum Server](https://discord.gg/VAeNtnBF)  

## Commands

- **Ping Slash Command**: Ein einfacher `/ping`-Befehl, der mit der aktuellen Latenz in Millisekunden antwortet.
---
- **Shutdown Slash Command**: Der `/shutdown`-Befehl, fährt den Bot herunter, dieser Befehl kann nur vom Owner des Bots ausgeführt werden!
---
- **Zitat Slash Command**: Mit dem `/quote`-Befehl, zeigt der Bot ein zufällig Zitat aus der [zenquotes.io](https://zenquotes.io)-API an.
---
- **Meme Slash Command**:`/meme` Mit diesem Befehl, zeigt der Bot ein zufällig Meme aus einer Meme-API an.
---
- **Uptime Slash Command**: Ein simpler `/uptime`-Befehl, welcher dir die Laufzeit des Discord Bots anzeigt.
---

## Weitere Funktionen

- **Willkommens Naricht**: Sobald ein neuer Member dem Server Joint wird im Willkommens-Kanal ein Embed gesendet (Wenn sich der Willkommens-Kanal ändert, bitte an Leon.H43/Gamer443 wenden!)
---
  - **Beta System**: Das Beta-System ermöglicht es, ausgewählte Benutzer als Beta-Tester hinzuzufügen und zu verwalten. Die folgenden Slash-Commands stehen zur Verfügung:
    <br><br>
    **/beta add (user)**: Fügt einen Benutzer als Beta-Tester hinzu. Der Benutzer erhält einen einzigartigen Beta-Key, der ihm speziellen Zugang gewährt. Der Key wird in der Datenbank gespeichert und per Direktnachricht an den Benutzer gesendet.
    <br><br>
    **/beta remove (user)**: Entfernt einen Benutzer aus der Liste der Beta-Tester. Der Benutzer wird aus der Datenbank gelöscht und verliert den Zugriff auf den Beta-Test.
    <br><br>
    **/beta limit (anzahl)**: Setzt ein Limit für die maximale Anzahl an Beta-Testern. Wenn das Limit erreicht ist, wird kein weiterer Benutzer hinzugefügt. Das Limit wird ebenfalls in der Datenbank gespeichert.
  <br><br>
    **/beta list**: Zeigt eine Liste aller aktuellen Beta-Tester an. Die Tester werden aus der Datenbank abgerufen und aufgelistet, jedoch ohne ihre Beta-Keys anzuzeigen.
    <br><br>
     Alle Daten, einschließlich der Beta-Tester und des festgelegten Limits, werden in einer SQLite-Datenbank gespeichert. Die Informationen bleiben auch nach einem Neustart des Bots erhalten.
    <br><br>
    **Hinweis**: Die Integration mit Roblox zur Überprüfung des Beta-Keys und dem Zugang zum Spiel funktioniert derzeit noch nicht. Diese Funktion wird zukünftig verfügbar sein.
---

## Weiterentwicklung

- **Neue Funktionen oder Bugs**: Im Issues Tab dieser Repository

## Installation [Für das Emskirchener-Busbetriebe Team!!!]

1. Klone das Repository:
   ```bash
   git clone https://github.com/Emskirchener-Busbetriebe/Discord-Bot.git
2. Installiere die benötigten Packete:
   ```bash
   npm install
   npm install axios
   npm install sqlite3
   npm install sqlite

3. Erstelle eine .env-Datei im Hauptverzeichnis und füge den Bot-Token und die ClientID ein. (Frage Leon nach den Daten.)
   ```bash
   TOKEN=Token
   CLIENT_ID=
4. Bot starten:
   ```bash
   node index.js

#### By Leon.H43/Gamer443 with ❤️
