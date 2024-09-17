import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { onAuthStateChanged } from 'firebase/auth';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <motion.h1
        className="text-3xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Agende Seu Corte
      </motion.h1>

      <div className="flex flex-col items-center space-y-4">
        {/* Link para agendar novo cliente */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xs"
        >
          <Link
            href="/user/cadastro"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg text-center text-lg font-semibold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Agende Seu Corte
          </Link>
        </motion.div>

        {/* Link para consultar agendamentos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-xs"
        >
          <Link
            href="/user/agendamentos"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg text-center text-lg font-semibold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Consultar Agendamentos
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
