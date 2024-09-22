import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';
import app from '../../../lib/firebase';
import moment from 'moment-timezone';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { format, parseISO, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LoadingSpinner from '../../../components/LoadingSpinner';
import DateModal from '../../../components/DateModal';
import TimeModal from '../../../components/TimeModal';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

function EditarCliente() {
    const router = useRouter();
    const { id } = router.query;
    const [cliente, setCliente] = useState(null);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');
    const [horaAgendamento, setHoraAgendamento] = useState('');
    const [error, setError] = useState('');
    const [showDateModal, setShowDateModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [horarios, setHorarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scheduledTimes, setScheduledTimes] = useState([]);
    const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);

    const db = getFirestore(app);

    const fetchCliente = async () => {
        if (!id) return;

        try {
            const clienteRef = doc(db, 'agendamentos', id);
            const clienteDoc = await getDoc(clienteRef);

            if (clienteDoc.exists()) {
                const data = clienteDoc.data();
                const dataHora = data.dataAgendamento.toDate();
                setCliente(data);
                setNome(data.nome);
                setEmail(data.email || '');
                setDataAgendamento(moment(dataHora).format('YYYY-MM-DD'));
                setHoraAgendamento(moment(dataHora).format('HH:mm'));
                setSelectedDate(dataHora);
                setCurrentMonth(dataHora);
            }
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            setError("Erro ao carregar os dados do cliente.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCliente();
    }, [id]);

    const generateCalendarDays = useCallback(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        const firstDayOfWeek = getDay(start);
        for (let i = 1; i <= firstDayOfWeek; i++) {
            days.unshift(new Date(start.getFullYear(), start.getMonth(), -i + 1));
        }

        while (days.length % 7 !== 0) {
            days.push(new Date(end.getFullYear(), end.getMonth() + 1, days.length - end.getDate() + 1));
        }

        return days;
    }, [currentMonth]);

    const generateHorarios = useCallback(async (date) => {
        if (!date) return;
        setIsLoadingHorarios(true);

        const start = 9; // 9:00
        const end = 18; // 18:00
        const interval = 30; // 30 minutes
        const generatedHorarios = [];

        for (let hour = start; hour < end; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                generatedHorarios.push(time);
            }
        }

        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        const agendamentos = agendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const scheduledTimesData = agendamentos.map(agendamento => 
            agendamento.dataAgendamento.toDate().toISOString()
        );
        setScheduledTimes(scheduledTimesData);

        const availableHorarios = generatedHorarios.map(time => {
            const [hour, minute] = time.split(':');
            const dateTime = new Date(date);
            dateTime.setHours(parseInt(hour), parseInt(minute));

            const isOccupied = agendamentos.some(agendamento => {
                if (agendamento.id === id) return false; // Exclude the current appointment
                const agendamentoDate = agendamento.dataAgendamento.toDate();
                return agendamentoDate.getTime() === dateTime.getTime();
            });

            return { time, isOccupied };
        });

        setHorarios(availableHorarios);
        setIsLoadingHorarios(false);
    }, [id, db]);

    useEffect(() => {
        if (selectedDate) {
            generateHorarios(selectedDate);
        }
    }, [selectedDate, generateHorarios]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setDataAgendamento(format(date, 'yyyy-MM-dd'));
        setShowDateModal(false);
        setShowTimeModal(true);
        generateHorarios(date);
    };

    const handleTimeSelect = (time) => {
        setHoraAgendamento(time);
        setShowTimeModal(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            const timeZone = 'America/Sao_Paulo';
            const dataHora = moment.tz(`${dataAgendamento} ${horaAgendamento}`, timeZone).toDate();

            // Verifica se a data selecionada é no passado
            if (dataHora < new Date()) {
                setError('Não é possível agendar para uma data no passado.');
                return;
            }

            const clienteRef = doc(db, 'agendamentos', id);

            const updatedData = {
                nome,
                dataAgendamento: dataHora
            };

            if (email) {
                updatedData.email = email;
            } else {
                // Se o email estiver vazio, remova-o do documento
                updatedData.email = null;
            }

            await updateDoc(clienteRef, updatedData);

            alert('Dados do cliente atualizados com sucesso!');
            router.push('/admin/agendamentos');
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            setError('Erro ao atualizar cliente. Tente novamente.');
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!cliente) return null;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 to-black text-white">
            <Link href="/admin/agendamentos" className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 ease-in-out transform hover:scale-105">
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
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email (opcional):</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowDateModal(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <FaCalendarAlt className="inline-block mr-2" />
                                {dataAgendamento ? format(new Date(dataAgendamento), 'dd/MM/yyyy') : 'Selecionar Data'}
                            </button>
                            <button
                                type="button"
                                onClick={() => dataAgendamento && setShowTimeModal(true)}
                                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105 ${!dataAgendamento ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!dataAgendamento}
                            >
                                <FaClock className="inline-block mr-2" />
                                {horaAgendamento || 'Selecionar Horário'}
                            </button>
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

            <DateModal 
                showModal={showDateModal}
                setShowModal={setShowDateModal}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                handleDateSelect={handleDateSelect}
                generateCalendarDays={generateCalendarDays}
            />

            <TimeModal
                showModal={showTimeModal}
                setShowModal={setShowTimeModal}
                selectedDate={selectedDate}
                handleTimeSelect={handleTimeSelect}
                horarios={horarios}
                scheduledTimes={scheduledTimes}
                isLoadingHorarios={isLoadingHorarios}
            />
        </div>
    );
}

export default EditarCliente;
