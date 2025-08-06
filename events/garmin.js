const { AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.reference) return;

        if (message.content.toLowerCase().includes('ok garmin, video speichern')) {
            try {
                // Nachricht und Autor holen
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                const author = repliedMessage.author;

                // Canvas (1280x720)
                const canvas = createCanvas(1280, 720);
                const ctx = canvas.getContext('2d');

                // SCHWARZER HINTERGRUND
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // PROFILBILD
                try {
                    const avatar = await loadImage(author.displayAvatarURL({ extension: 'png', size: 512 }));

                    // Kreis-Maske
                    const avatarSize = 400;
                    const avatarX = 250;
                    const avatarY = canvas.height / 2;

                    ctx.beginPath();
                    ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.save();
                    ctx.clip();

                    // Schwarzweiß
                    ctx.drawImage(avatar, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
                    const imageData = ctx.getImageData(avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = data[i + 1] = data[i + 2] = avg;
                    }
                    ctx.putImageData(imageData, avatarX - avatarSize/2, avatarY - avatarSize/2);
                    ctx.restore();

                } catch (error) {
                    console.error('Profilbild-Fehler:', error);
                }

                // NACHRICHT RECHTS,
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '48px Arial';

                const textCenterX = 900;
                const textCenterY = canvas.height / 2;
                const maxWidth = 600;
                const lineHeight = 60;

                const lines = wrapText(ctx, repliedMessage.content, maxWidth);
                let textBlockHeight = lines.length * lineHeight;
                let startY = textCenterY - (textBlockHeight / 2) + lineHeight/2;

                lines.forEach(line => {
                    ctx.fillText(line, textCenterX, startY);
                    startY += lineHeight;
                });

                // AUTORNAME
                ctx.fillStyle = '#AAAAAA';
                ctx.font = 'italic 32px Arial';
                ctx.fillText(`— ${author.username}`, textCenterX, startY + 50);

                const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'garmin-quote.png' });
                await message.reply({
                    content: '*Diu Diu*',
                    files: [attachment]
                });

            } catch (error) {
                console.error('Fehler:', error);
                await message.reply('❌ Fehler beim Erstellen des Zitats!');
            }
        }
    }
};

// Textumbruch-Funktion
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width < maxWidth) {
            currentLine = testLine;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
}