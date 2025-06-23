const { execSync } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

const NAPS2_PATH = path.join(__dirname,'naps2/App/NAPS2.Console.exe');
const OUTPUT_FILE = 'scan.png';
const DISCORD_WEBHOOK_URL = '';

function getScannerName() {
    try {
        const output = execSync(`"${NAPS2_PATH}" --listdevices --driver wia`).toString();
        const match = output.match(/^(.+)$/m);
        if (!match) throw new Error("Nenhum scanner encontrado.");
        console.log(`Scanner detectado: ${match[1].trim()}`);
        return match[1].trim();
    } catch (err) {
        console.error("Erro ao detectar scanner:", err.message);
        process.exit(1);
    }
}
function scanImage(scannerName) {
    try {
        console.log(`Escaneando... Aguarde.`);
        execSync(`"${NAPS2_PATH}" --device "${scannerName}" --output ${OUTPUT_FILE} -f --driver wia`);
        console.log(`Imagem salva como: ${OUTPUT_FILE}`);
    } catch (err) {
        console.error("Erro ao escanear:", err.message);
        process.exit(1);
    }
}
async function sendToDiscord(filename, printerName) {
    const form = new FormData();

    const fileStream = fs.createReadStream(filename);
    const fileNameOnly = path.basename(filename);

    form.append('file', fileStream, fileNameOnly);

    const payload = {
        username: printerName,
        avatar_url: "https://em-content.zobj.net/source/toss-face/381/printer_1f5a8-fe0f.png",
        embeds: [
            {
                title: '📄 Nova folha',
                color: 0x9B59B6,
                timestamp: new Date().toISOString(),
                image: {
                    url: `attachment://${fileNameOnly}`
                }
            }
        ]
    };

    form.append('payload_json', JSON.stringify(payload));
    
    await axios.post(DISCORD_WEBHOOK_URL, form, { headers: form.getHeaders() });
    console.log("Imagem enviada ao Discord.");
}

(async () => {
    const printerName = getScannerName();
    scanImage(printerName);
    await sendToDiscord(OUTPUT_FILE, printerName);
    fs.unlinkSync(OUTPUT_FILE);
    console.log("Imagem temporaria deletada.");
})();