import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';

// Import Flaticon icons
import { GiBeard, GiHairStrands, GiRazor } from 'react-icons/gi';

function Servicos() {
  const router = useRouter();

  const services = [
    { id: 'corte_cabelo', name: 'Corte de Cabelo', price: 'R$ 35,00', icon: <GiHairStrands size={50} /> }, // Icon for hair cut
    { id: 'corte_barba', name: 'Corte de Barba', price: 'R$ 25,00', icon: <GiBeard size={50} /> }, // Icon for beard cut
    { id: 'corte_cabelo_barba', name: 'Corte de Cabelo e Barba', price: 'R$ 50,00', icon: <GiRazor size={50} /> }, // Icon for hair and beard cut
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
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col">
      <UserHeader />
      <div className="flex flex-col flex-grow w-full text-white pt-16">
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-8 text-blue-400"
          >
            Nossos Serviços
          </motion.h1>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-5xl"
          >
            {services.map((service) => (
              <motion.div key={service.id} variants={itemVariants}>
                <Link href={`/user/cadastro?servico=${service.id}`} className="flex flex-col items-center justify-center p-8 bg-blue-900 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105 w-full h-full group">
                  <div className="mb-6 text-blue-300 group-hover:text-blue-200 transition-colors">{service.icon}</div>
                  <h2 className="text-2xl font-bold mb-2 text-center">{service.name}</h2>
                  <p className="text-3xl font-bold text-blue-300">{service.price}</p>
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
            <Link href="/" className="text-blue-400 hover:text-blue-500 transition-colors">
              Voltar para a página inicial
            </Link>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Servicos;
