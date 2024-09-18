import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';

const Home = () => {
  const [randomText, setRandomText] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          setRole(userData.role);

          if (userData.role !== 'admin') {
            router.push('/'); // Redireciona se o papel não for admin
          }
        } else {
          console.log("Documento não encontrado.");
        }
      } else {
        router.push('/login'); // Redireciona se não estiver logado
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  useEffect(() => {
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

    setTimeout(() => {
      generateRandomText();
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (role === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 py-8">
      <motion.h1
        className="text-3xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {randomText}
      </motion.h1>

      <div className="flex flex-col space-y-4 w-full max-w-xs">
        {/* Link para agendar novo cliente */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/admin/cadastro"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg text-center text-lg font-semibold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Agendar Novo Cliente
          </Link>
        </motion.div>

        {/* Link para visualizar cadastros */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/admin/agendamentos"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg text-center text-lg font-semibold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Visualizar Cadastros
          </Link>
        </motion.div>

        {/* Link para calendário */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href="/admin/calendario"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg text-center text-lg font-semibold shadow-md hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Calendário
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
