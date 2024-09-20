import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import UserHeader from '../components/UserHeader';

function Servicos  () {
  const router = useRouter();

  const services = [
    { id: 'corte_cabelo', name: 'Corte de Cabelo', price: 'R$ 35,00' },
    { id: 'corte_barba', name: 'Corte de Barba', price: 'R$ 25,00' },
    { id: 'corte_cabelo_barba', name: 'Corte de Cabelo e Barba', price: 'R$ 50,00' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <UserHeader />
      <div className="flex flex-col min-h-screen w-full text-white pt-16">
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold mb-8 text-blue-300"
          >
            Nossos Serviços
          </motion.h1>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl"
          >
            {services.map((service) => (
              <motion.div key={service.id} variants={itemVariants}>
                <Link href={`/user/cadastro?servico=${service.id}`} className="flex flex-col items-center justify-center p-6 bg-blue-800 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors w-full h-full group">
                  <h2 className="text-xl font-semibold mb-2 text-center">{service.name}</h2>
                  <p className="text-2xl font-bold text-blue-300">{service.price}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            <Link href="/" className="text-blue-300 hover:text-blue-400 transition-colors">
              Voltar para a página inicial
            </Link>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Servicos;
