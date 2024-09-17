// pages/user/agendamentos.jsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import app from '../../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaUser, FaEnvelope } from 'react-icons/fa';

function Agendamentos() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentAgendamento, setRecentAgendamento] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserEmail(user.email); // Armazena o email do usuário

                try {
                    // Consulta filtrada para agendamentos pelo email do usuário
                    const q = query(collection(db, 'agendamentos'), where('email', '==', user.email));
                    const agendamentosSnapshot = await getDocs(q);
                    const agendamentosList = agendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                    // Ordena por data e encontra o agendamento mais recente
                    agendamentosList.sort((a, b) => b.dataAgendamento.toDate() - a.dataAgendamento.toDate());
                    setRecentAgendamento(agendamentosList[0]);
                    setAgendamentos(agendamentosList);
                } catch (error) {
                    console.error('Erro ao buscar agendamentos:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center px-4 py-8">
            <motion.h1
                className="text-3xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Histórico de Agendamentos
            </motion.h1>

            {recentAgendamento && (
                <motion.div
                    className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                        <FaCalendarAlt className="mr-2 text-blue-400" />
                        Agendamento Mais Recente
                    </h2>
                    <p className="mb-2"><strong>Nome:</strong> {recentAgendamento.nome}</p>
                    <p className="mb-2"><strong>Email:</strong> {recentAgendamento.email}</p>
                    <p className="mb-2"><strong>Data e Hora:</strong> {recentAgendamento.dataAgendamento.toDate().toLocaleString()}</p>
                </motion.div>
            )}

            <div className="w-full max-w-lg">
                {agendamentos.length > 0 ? (
                    <ul className="space-y-4">
                        {agendamentos.map((agendamento) => (
                            <motion.li
                                key={agendamento.id}
                                className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex-1">
                                    <p className="mb-1"><strong>Nome:</strong> {agendamento.nome}</p>
                                    <p className="mb-1"><strong>Email:</strong> {agendamento.email}</p>
                                    <p className="mb-1"><strong>Data e Hora:</strong> {agendamento.dataAgendamento.toDate().toLocaleString()}</p>
                                </div>
                                <FaCalendarAlt className="text-blue-400 ml-4" />
                            </motion.li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-400">Nenhum agendamento encontrado.</p>
                )}
            </div>

            <Link href="/" className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
                Voltar
            </Link>
        </div>
    );
}

export default Agendamentos;
