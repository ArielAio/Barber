import chrome from 'chrome-aws-lambda';
import { Client } from 'whatsapp-web.js';
import qrcode from 'qrcode';

let client = null;
let qrCodeData = null;
let isReady = false;
let messageQueue = [];

// Função para enviar mensagens enfileiradas
async function sendQueuedMessages() {
    while (messageQueue.length > 0 && isReady) {
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

// Função para inicializar o cliente do WhatsApp
async function initializeClient() {
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
                qrCodeData = await qrcode.toDataURL(qr);  // Gera o QR Code
                isReady = false;
            } catch (err) {
                console.error('Erro ao gerar QR code:', err);
            }
        });

        client.on('ready', () => {
            console.log('Cliente está pronto!');
            qrCodeData = null;
            isReady = true;
            sendQueuedMessages();  // Envia as mensagens enfileiradas
        });

        client.on('disconnected', () => {
            console.log('Cliente desconectado. Reinicializando...');
            isReady = false;
            client = null;
        });

        await client.initialize();  // Inicializa o cliente
    }
}

export default async function handler(req, res) {
    try {
        // Inicializa o cliente se necessário
        await initializeClient();

        if (req.method === 'GET') {
            if (qrCodeData) {
                res.status(200).json({ qrCode: qrCodeData, isReady: false });  // QR code disponível
            } else if (isReady) {
                res.status(200).json({ status: 'Cliente conectado', isReady: true });  // Cliente conectado
            } else {
                res.status(202).json({ status: 'Aguardando QR Code', isReady: false });  // Aguardando conexão
            }
        } else if (req.method === 'POST') {
            const { phoneNumber, message } = req.body;

            if (!phoneNumber || !message) {
                return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
            }

            if (!isReady) {
                messageQueue.push({ phoneNumber, message, res });
                return res.status(202).json({ status: 'Cliente não conectado. Mensagem enfileirada.' });
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
