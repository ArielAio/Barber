import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarPlus, FaListAlt } from 'react-icons/fa';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        const userData = userDoc.data();
        setUser({ ...authUser, ...userData });
        setLoading(false);
      } else {
        router.push('/login');
      }
    });

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    // Add a minimum loading time of 1 second for smoother transitions
    const minLoadingTime = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(minLoadingTime);
    };
  }, [router]);

  // Separate loading component for smoother transition
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex items-center justify-center"
      >
        <LoadingSpinner />
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <AnimatePresence>
        <motion.div
          className="flex flex-col min-h-screen w-full text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
            <motion.h2
              className="text-3xl sm:text-4xl font-bold mb-4 text-center text-blue-300"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {greeting}, {user?.username || 'Cliente'}!
            </motion.h2>

            <motion.p
              className="text-lg sm:text-xl mb-8 text-center text-blue-200"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Bem-vindo à nossa Barbearia! O que você gostaria de fazer hoje?
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/user/cadastro" passHref>
                  <motion.a
                    className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:bg-blue-700 transition-colors w-full"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaCalendarPlus className="mr-3 text-xl" />
                    Agende Seu Corte
                  </motion.a>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/user/agendamentos" passHref>
                  <motion.a
                    className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:bg-green-700 transition-colors w-full"
                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(16, 185, 129, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaListAlt className="mr-3 text-xl" />
                    Consultar Agendamentos
                  </motion.a>
                </Link>
              </motion.div>
            </div>
          </main>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Home;
