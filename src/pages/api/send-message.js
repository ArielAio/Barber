import chrome from 'chrome-aws-lambda';
import { Client } from 'whatsapp-web.js';

let client = null;
let qrCodeData = null;
let isReady = false;
let messageQueue = [];

async function sendQueuedMessages() {
    while (messageQueue.length > 0) {
        const { phoneNumber, message, res } = messageQueue.shift();
        try {
            const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
            await client.sendMessage(chatId, message);
            res.status(200).json({ status: 'Mensagem enviada com sucesso' });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            res.status(500).json({ error: 'Erro ao enviar mensagem' });
        }
    }
}

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            if (!client) {
                const browserArgs = {
                    puppeteer: {
                        args: [...chrome.args, '--no-sandbox', '--disable-setuid-sandbox'],
                        executablePath: await chrome.executablePath,
                        headless: true,
                    },
                };

                client = new Client(browserArgs);

                client.on('qr', async (qr) => {
                    try {
                        qrCodeData = await qrcode.toDataURL(qr);
                        isReady = false;
                    } catch (err) {
                        console.error('Error generating QR code:', err);
                    }
                });

                client.on('ready', () => {
                    console.log('Client is ready!');
                    qrCodeData = null;
                    isReady = true;
                    sendQueuedMessages();
                });

                await client.initialize();
            }

            if (qrCodeData) {
                res.status(200).json({ qrCode: qrCodeData, isReady: false });
            } else if (isReady) {
                res.status(200).json({ status: 'Cliente conectado', isReady: true });
            } else {
                res.status(202).json({ status: 'Aguardando QR Code', isReady: false });
            }
        } else if (req.method === 'POST') {
            const { phoneNumber, message } = req.body;

            if (!phoneNumber || !message) {
                return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
            }

            if (!isReady) {
                messageQueue.push({ phoneNumber, message, res });
                return res.status(202).json({ status: 'Mensagem enfileirada' });
            }

            try {
                const chatId = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
                await client.sendMessage(chatId, message);
                res.status(200).json({ status: 'Mensagem enviada com sucesso' });
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                res.status(500).json({ error: 'Erro ao enviar mensagem' });
            }
        } else {
            res.status(405).json({ error: 'Método não permitido' });
        }
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
