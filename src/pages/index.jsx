import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarPlus, FaListAlt, FaUserCircle } from 'react-icons/fa';

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

    return () => unsubscribe();
  }, [auth, router]);

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="absolute top-4 right-4 flex items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <FaUserCircle className="text-3xl mr-2" />
          <span className="font-semibold">{user?.username || user?.email}</span>
        </motion.div>

        <motion.h1
          className="text-4xl font-bold mb-4 text-center text-blue-300"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {greeting}, {user?.username || 'Cliente'}!
        </motion.h1>

        <motion.p
          className="text-xl mb-12 text-center text-blue-200"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Bem-vindo à nossa Barbearia!
        </motion.p>

        <div className="flex flex-col items-center space-y-6 w-full max-w-md">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link href="/user/cadastro">
              <motion.a
                className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg text-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <FaCalendarPlus className="mr-3" />
                Agende Seu Corte
              </motion.a>
            </Link>
          </motion.div>

          <motion.div
            className="w-full"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Link href="/user/agendamentos">
              <motion.a
                className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg text-xl font-semibold shadow-lg hover:bg-green-700 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <FaListAlt className="mr-3" />
                Consultar Agendamentos
              </motion.a>
            </Link>
          </motion.div>
        </div>

      </motion.div>
    </AnimatePresence >
  );
};

export default Home;
