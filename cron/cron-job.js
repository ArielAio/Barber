const cron = require('node-cron');
const fetch = require('node-fetch');

// Agendamento diário à meia-noite
cron.schedule('0 0 * * *', () => {
  // Função para buscar os clientes que precisam ser notificados
  const clients = getClientsThatNeedNotification();

  clients.forEach(client => {
    fetch('https://barber-agenda.vercel.app/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: client.phoneNumber,    // Número do cliente
        message: 'Olá, já se passaram 30 dias desde o seu último agendamento!',  // Mensagem
      }),
    })
    .then(response => response.json())
    .then(data => console.log('Mensagem enviada:', data))
    .catch(error => console.error('Erro ao enviar mensagem:', error));
  });
});

// Função fictícia para buscar clientes
function getClientsThatNeedNotification() {
  // Simulação de dados de clientes (substituir pela lógica real)
  return [
    { phoneNumber: '5517996658986' },  // Exemplo de número
  ];
}
