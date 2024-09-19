import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';
import app from '../../../lib/firebase';
import moment from 'moment-timezone';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendarAlt, FaClock } from 'react-icons/fa';

function EditarCliente() {
    const router = useRouter();
    const { id } = router.query;
    const [cliente, setCliente] = useState(null);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');
    const [horaAgendamento, setHoraAgendamento] = useState('');
    const [error, setError] = useState('');

    // Função para buscar os dados do cliente
    const fetchCliente = async () => {
        if (!id) return;

        const db = getFirestore(app);
        const clienteRef = doc(db, 'agendamentos', id);
        const clienteDoc = await getDoc(clienteRef);

        if (clienteDoc.exists()) {
            const data = clienteDoc.data();
            const dataHora = data.dataAgendamento.toDate();
            setCliente(data);
            setNome(data.nome);
            setEmail(data.email);
            setDataAgendamento(moment(dataHora).format('YYYY-MM-DD')); // Formatando a data
            setHoraAgendamento(moment(dataHora).format('HH:mm')); // Formatando a hora
        }
    };

    useEffect(() => {
        fetchCliente(); // Carrega os dados ao montar o componente
    }, [id]);

    const checkAvailability = async (start, end) => {
        const db = getFirestore(app);
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));

        return agendamentosSnapshot.docs.every(doc => {
            const data = doc.data();
            const existingStart = data.dataAgendamento.toDate();
            const existingEnd = new Date(existingStart.getTime() + 30 * 60000); // Define o final como 30 minutos após o início

            // Verifica se o novo horário se sobrepõe a algum agendamento existente
            return end <= existingStart || start >= existingEnd;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            // Combina a data e a hora
            const [ano, mes, dia] = dataAgendamento.split('-').map(Number);
            const [hora, minuto] = horaAgendamento.split(':').map(Number);

            // Ajuste o fuso horário conforme necessário
            const timeZone = 'America/Sao_Paulo';
            const dataHora = moment.tz({ year: ano, month: mes - 1, day: dia, hour: hora, minute: minuto }, timeZone).toDate();

            // Verifica se a data selecionada é no passado
            if (dataHora.isBefore(moment())) {
                setError('Não é possível agendar para uma data no passado.');
                return;
            }

            // Calcula o início e o fim do novo agendamento
            const newStart = dataHora;
            const newEnd = new Date(newStart.getTime() + 30 * 60000);

            // Verifica se o horário está disponível
            const isAvailable = await checkAvailability(newStart, newEnd);

            if (!isAvailable) {
                setError('O horário selecionado não está disponível. Escolha outro horário.');
                return;
            }

            const db = getFirestore(app);
            const clienteRef = doc(db, 'agendamentos', id);

            await updateDoc(clienteRef, {
                nome,
                email,
                dataAgendamento: dataHora // Atualiza a data e hora
            });

            alert('Dados do cliente atualizados com sucesso!');
            router.push('/admin/agendamentos'); // Navega de volta para a lista de clientes
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            alert('Erro ao atualizar cliente. Tente novamente.');
        }
    };

    if (!cliente) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-white text-2xl font-bold"
            >
                Carregando...
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 to-black text-white">
            <Link href="/agendamentos" className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 ease-in-out transform hover:scale-105">
                <FaArrowLeft className="inline-block mr-2" /> Voltar
            </Link>

            <header className="py-8 px-6 text-center">
                <motion.h1 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold"
                >
                    Editar Cliente
                </motion.h1>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md p-8 bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl shadow-2xl"
                >
                    {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome:</label>
                            <input
                                type="text"
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email:</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label htmlFor="data" className="block text-sm font-medium mb-1">Data:</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
                                    <input
                                        type="date"
                                        id="data"
                                        value={dataAgendamento}
                                        onChange={(e) => setDataAgendamento(e.target.value)}
                                        min={moment().format('YYYY-MM-DD')} // Set minimum date to today
                                        className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex-1">
                                <label htmlFor="hora" className="block text-sm font-medium mb-1">Horário:</label>
                                <div className="relative">
                                    <FaClock className="absolute top-3 left-3 text-gray-400" />
                                    <input
                                        type="time"
                                        id="hora"
                                        value={horaAgendamento}
                                        onChange={(e) => setHoraAgendamento(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 ease-in-out"
                        >
                            Atualizar
                        </motion.button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}

export default EditarCliente;
