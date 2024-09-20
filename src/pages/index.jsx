import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarPlus, FaListAlt, FaCut } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [greeting, setGreeting] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ ...authUser, ...userData });
          } else {
            console.error("User document does not exist");
            router.push('/login');
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Bom dia');
      else if (hour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');
    };

    updateGreeting();
    const intervalId = setInterval(updateGreeting, 60000); // Update greeting every minute

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const buttonVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="flex flex-col min-h-screen w-full text-white pt-16">
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-blue-300">
              {greeting}, {user?.username || 'Cliente'}!
            </h2>
            <p className="text-lg sm:text-xl text-blue-200 mb-8">
              Bem-vindo à nossa Barbearia! O que você gostaria de fazer hoje?
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl"
          >
            <motion.div variants={itemVariants}>
              <Link href="/servicos" className="flex flex-col items-center justify-center px-6 py-8 bg-purple-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:bg-purple-700 transition-colors w-full h-full group">
                <FaCut className="text-4xl mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-center group-hover:underline">Nossos Serviços</span>
              </Link>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Link href="/user/cadastro" className="flex flex-col items-center justify-center px-6 py-8 bg-blue-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:bg-blue-700 transition-colors w-full h-full group">
                <FaCalendarPlus className="text-4xl mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-center group-hover:underline">Agende Seu Corte</span>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="/user/agendamentos" className="flex flex-col items-center justify-center px-6 py-8 bg-green-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:bg-green-700 transition-colors w-full h-full group">
                <FaListAlt className="text-4xl mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-center group-hover:underline">Consultar Agendamentos</span>
              </Link>
            </motion.div>

          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Home;
