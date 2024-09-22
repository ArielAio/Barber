// pages/api/send-message.js

import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import cron from 'node-cron';

let client = null;
let qrCodeData = null;
let isReady = false;
let messageQueue = [];

// Inicializa o cliente do WhatsApp
async function initializeClient() {
    if (!client) {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
            },
        });

        client.on('qr', async (qr) => {
            qrCodeData = await qrcode.toDataURL(qr);
            isReady = false;
        });

        client.on('ready', () => {
            console.log('Cliente está pronto!');
            qrCodeData = null;
            isReady = true;
            sendQueuedMessages(); // Envia mensagens enfileiradas
        });

        client.on('disconnected', () => {
            console.log('Cliente desconectado. Reinicializando...');
            isReady = false;
            client = null;
        });

        await client.initialize();
    }
}

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

// Agendamento de mensagens
cron.schedule('0 0 1 * *', async () => {
    const clients = await getClientList(); // Função para pegar a lista de clientes
    for (const client of clients) {
        const message = "Sua mensagem mensal aqui!";
        await sendMessage(client.phoneNumber, message);
    }
});

// Handler da API
export default async function handler(req, res) {
    try {
        await initializeClient();

        if (req.method === 'GET') {
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
                return res.status(202).json({ status: 'Cliente não conectado. Mensagem enfileirada.' });
            }

            await sendQueuedMessages();
        } else {
            res.status(405).json({ error: 'Método não permitido' });
        }
    } catch (error) {
        console.error('Erro no servidor:', error);
        res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
}
