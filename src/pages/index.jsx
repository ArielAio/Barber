import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const Home = () => {
  const [randomText, setRandomText] = useState('');

  useEffect(() => {
    // Função para gerar um texto aleatório
    const generateRandomText = () => {
      const texts = [
        'Bem-vindo à Barbearia!',
        'Oferecemos os melhores cortes da cidade.',
        'Venha nos visitar!',
        'Cortes modernos e clássicos.',
        'Sua satisfação é nossa prioridade.'
      ];
      const randomIndex = Math.floor(Math.random() * texts.length);
      setRandomText(texts[randomIndex]);
    };

    generateRandomText();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* Cabeçalho */}
      <h1 className="text-4xl font-bold mb-10 text-center">{randomText}</h1>

      {/* Links */}
      <div className="flex flex-col space-y-4 w-full max-w-screen-sm px-6 sm:px-8 md:px-12 lg:px-16 xl:px-32">
        {/* Link para agendar novo cliente */}
        <Link href="/cadastro" className="block w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 text-center">
          Agendar novo cliente

        </Link>

        {/* Link para visualizar cadastros */}
        <Link href="/agendamentos" className="block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 text-center">
          Visualizar cadastros
        </Link>
      </div>
    </div>
  );
};

export default Home;
