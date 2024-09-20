import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CalendarioConfig from '../../components/CalendarioConfig';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../../lib/firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
import Footer from '../../components/Footer';

const Calendario = () => {
    const [role, setRole] = useState(null);
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setRole(userData.role);

                    if (userData.role !== 'admin') {
                        router.push('/');
                    }
                } else {
                    console.log("Documento não encontrado.");
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    if (role === null) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white flex flex-col"
        >
            <div className="container mx-auto px-4 py-4 sm:py-8 flex-grow">
                <header className="mb-4 sm:mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <h1 className="text-2xl sm:text-4xl font-bold flex items-center mb-4 sm:mb-0">
                            <FaCalendarAlt className="mr-2 sm:mr-4" />
                            Calendário de Agendamentos
                        </h1>
                        <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out flex items-center">
                            <FaArrowLeft className="mr-2" />
                            Voltar
                        </Link>
                    </div>
                    <p className="mt-2 text-gray-300 text-sm sm:text-base">Gerencie seus agendamentos de forma eficiente</p>
                </header>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-lg shadow-2xl overflow-hidden"
                >
                    <CalendarioConfig />
                </motion.div>
            </div>
            <Footer />
        </motion.div>
    );
};

export default Calendario;
