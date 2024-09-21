import { create } from '@open-wa/wa-automate';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { phoneNumber, message } = req.body;

    // Conectar ao WhatsApp Web e enviar a mensagem
    create({
      sessionId: 'my-session',                 // Nome da sessão
      sessionDataPath: './session_data',       // Caminho para salvar o estado da sessão
    }).then(async client => {
      try {
        await client.sendText(phoneNumber, message);  // Enviar mensagem
        res.status(200).json({ status: 'Mensagem enviada com sucesso!' });
      } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar mensagem', details: error });
      } finally {
        client.kill();  // Encerrar sessão do WhatsApp Web
      }
    }).catch(err => {
      res.status(500).json({ error: 'Erro ao iniciar sessão do WhatsApp', details: err });
    });
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}
