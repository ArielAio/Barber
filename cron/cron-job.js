import fetch from 'node-fetch';

// Função para buscar os clientes que precisam ser notificados
async function getClientsThatNeedNotification() {
  // Simulação de dados de clientes (substituir pela lógica real)
  return [
    { phoneNumber: '5517996658986' },  // Exemplo de número
  ];
}

export default async function handler(req, res) {
  // Verifique se a solicitação é um POST e tem a chave secreta correta
  if (req.method !== 'POST' || req.headers['x-cron-key'] !== process.env.CRON_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Buscar os clientes que precisam ser notificados
    const clients = await getClientsThatNeedNotification();

    // Array para armazenar as promessas de envio de mensagens
    const messagePromises = clients.map(client => 
      fetch('https://barber-agenda.vercel.app/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: client.phoneNumber,
          message: 'Olá, já se passaram 30 dias desde o seu último agendamento!',
        }),
      })
      .then(response => response.json())
      .then(data => {
        console.log('Mensagem enviada:', data);
        return data;
      })
      .catch(error => {
        console.error('Erro ao enviar mensagem:', error);
        return { error: error.message };
      })
    );

    // Aguardar todas as mensagens serem enviadas
    const results = await Promise.all(messagePromises);

    // Retornar o resultado
    res.status(200).json({ status: 'Notificações processadas', results });
  } catch (error) {
    console.error('Erro no processamento do cron job:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
