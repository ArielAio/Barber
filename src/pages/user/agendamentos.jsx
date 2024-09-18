// pages/user/agendamentos.jsx
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import app from '../../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaUser, FaEnvelope, FaEdit, FaTrashAlt } from 'react-icons/fa';

function Agendamentos() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentAgendamento, setRecentAgendamento] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [selectedAgendamento, setSelectedAgendamento] = useState(null);
    const [nome, setNome] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserEmail(user.email); // Armazena o email do usuário

                try {
                    const q = query(collection(db, 'agendamentos'), where('email', '==', user.email));
                    const agendamentosSnapshot = await getDocs(q);
                    const agendamentosList = agendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    const handleEdit = (agendamento) => {
        setSelectedAgendamento(agendamento);
        setNome(agendamento.nome);
        setDataAgendamento(agendamento.dataAgendamento.toDate().toISOString().slice(0, 16)); // Define o valor inicial no formato YYYY-MM-DDTHH:MM
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (window.confirm('Tem certeza que deseja atualizar este agendamento?')) {
            try {
                const agendamentoRef = doc(db, 'agendamentos', selectedAgendamento.id);
                await updateDoc(agendamentoRef, {
                    nome,
                    dataAgendamento: new Date(dataAgendamento) // Atualiza a data com o novo valor
                });
                setSelectedAgendamento(null);
                setNome('');
                setDataAgendamento('');
                setFeedbackMessage('Agendamento atualizado com sucesso!');
                // Atualiza a lista de agendamentos
                const updatedAgendamentosSnapshot = await getDocs(query(collection(db, 'agendamentos'), where('email', '==', userEmail)));
                const updatedAgendamentosList = updatedAgendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAgendamentos(updatedAgendamentosList);
            } catch (error) {
                console.error('Erro ao atualizar o agendamento:', error);
                setFeedbackMessage('Erro ao atualizar o agendamento.');
            }
        }
    };

    const handleCancel = async (agendamentoId) => {
        if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                const agendamentoRef = doc(db, 'agendamentos', agendamentoId);
                await deleteDoc(agendamentoRef);
                setFeedbackMessage('Agendamento cancelado com sucesso!');
                // Atualiza a lista de agendamentos
                const updatedAgendamentosSnapshot = await getDocs(query(collection(db, 'agendamentos'), where('email', '==', userEmail)));
                const updatedAgendamentosList = updatedAgendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAgendamentos(updatedAgendamentosList);
            } catch (error) {
                console.error('Erro ao cancelar o agendamento:', error);
                setFeedbackMessage('Erro ao cancelar o agendamento.');
            }
        }
    };

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

            {feedbackMessage && (
                <div className="w-full max-w-lg bg-gray-800 p-4 rounded-lg shadow-lg mb-8 text-center text-yellow-400">
                    {feedbackMessage}
                </div>
            )}

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

            {selectedAgendamento && (
                <motion.div
                    className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                        <FaEdit className="mr-2 text-yellow-400" />
                        Editar Agendamento
                    </h2>
                    <form onSubmit={handleUpdate}>
                        <label htmlFor="nome" className="block text-lg">Nome:</label>
                        <input
                            type="text"
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="mt-2 w-full p-2 border border-gray-600 rounded bg-gray-700"
                        />
                        <label htmlFor="dataAgendamento" className="block text-lg mt-4">Data e Hora:</label>
                        <input
                            type="datetime-local"
                            id="dataAgendamento"
                            value={dataAgendamento}
                            onChange={(e) => setDataAgendamento(e.target.value)}
                            className="mt-2 w-full p-2 border border-gray-600 rounded bg-gray-700"
                        />
                        <button
                            type="submit"
                            className="mt-4 mr-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            Atualizar
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedAgendamento(null)}
                            className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Cancelar
                        </button>
                    </form>
                </motion.div>
            )}

            <div className="w-full max-w-lg">
                {agendamentos.length > 0 ? (
                    <ul className="space-y-4">
                        {agendamentos.map((agendamento) => (
                            <motion.li
                                key={agendamento.id}
                                className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex-1">
                                    <p className="mb-1"><strong>Nome:</strong> {agendamento.nome}</p>
                                    <p className="mb-1"><strong>Email:</strong> {agendamento.email}</p>
                                    <p className="mb-1"><strong>Data e Hora:</strong> {agendamento.dataAgendamento.toDate().toLocaleString()}</p>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleEdit(agendamento)}
                                        className="text-yellow-400 hover:text-yellow-600 mr-4"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleCancel(agendamento.id)}
                                        className="text-red-400 hover:text-red-600"
                                        disabled={new Date(agendamento.dataAgendamento.toDate()) < new Date()}
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
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
