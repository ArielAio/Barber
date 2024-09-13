import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner'; // Importando o componente

const Home = () => {
  const [randomText, setRandomText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula um atraso para o carregamento
    setTimeout(() => {
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
      setLoading(false); // Remove o spinner após o carregamento
    }, 2000); // Ajuste o tempo conforme necessário
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* Cabeçalho com animação */}
      <motion.h1
        className="text-4xl font-bold mb-10 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {randomText}
      </motion.h1>

      {/* Links */}
      <div className="flex flex-col space-y-4 w-full max-w-screen-sm px-6 sm:px-8 md:px-12 lg:px-16 xl:px-32">
        {/* Link para agendar novo cliente */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/cadastro" className="block w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 text-center">
            Agendar novo cliente
          </Link>
        </motion.div>

        {/* Link para visualizar cadastros */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/agendamentos" className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 text-center">
            Visualizar cadastros
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link href="/calendario" className="block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 text-center">
            Calendario
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
