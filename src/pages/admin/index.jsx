import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaCalendarAlt, FaUserPlus, FaList } from 'react-icons/fa';
import Footer from '../../components/Footer';

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

  const menuItems = [
    { href: '/admin/cadastro', icon: FaUserPlus, text: 'Agendar Novo Cliente' },
    { href: '/admin/agendamentos', icon: FaList, text: 'Visualizar Cadastros' },
    { href: '/admin/calendario', icon: FaCalendarAlt, text: 'Calendário' },
  ];

  if (loading || role === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-8">
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {randomText}
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1, ease: "easeOut" }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={item.href}>
                <div className="flex flex-col items-center justify-center p-6 bg-white bg-opacity-10 rounded-xl backdrop-filter backdrop-blur-lg shadow-lg hover:bg-opacity-20 transition-all duration-200">
                  <item.icon className="text-4xl mb-4 text-blue-400" />
                  <span className="text-lg font-semibold text-center">{item.text}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
