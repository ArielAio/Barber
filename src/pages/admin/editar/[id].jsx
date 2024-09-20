import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';
import app from '../../../lib/firebase';
import moment from 'moment-timezone';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaTimes } from 'react-icons/fa';
import { format, addDays, isSunday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LoadingSpinner from '../../../components/LoadingSpinner';

function EditarCliente() {
    const router = useRouter();
    const { id } = router.query;
    const [cliente, setCliente] = useState(null);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');
    const [horaAgendamento, setHoraAgendamento] = useState('');
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState('date');
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [horarios, setHorarios] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const db = getFirestore(app);

    // Função para buscar os dados do cliente
    const fetchCliente = async () => {
        if (!id) return;

        const clienteRef = doc(db, 'agendamentos', id);
        const clienteDoc = await getDoc(clienteRef);

        if (clienteDoc.exists()) {
            const data = clienteDoc.data();
            const dataHora = data.dataAgendamento.toDate();
            setCliente(data);
            setNome(data.nome);
            setEmail(data.email);
            setDataAgendamento(moment(dataHora).format('YYYY-MM-DD'));
            setHoraAgendamento(moment(dataHora).format('HH:mm'));
            setSelectedDate(dataHora);
            setCurrentMonth(dataHora);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCliente();
    }, [id]);

    const generateHorarios = useCallback(async (date) => {
        if (!date) return;

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
    }, [id, db]);

    useEffect(() => {
        if (selectedDate) {
            generateHorarios(selectedDate);
        }
    }, [selectedDate, generateHorarios]);

    const generateCalendarDays = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setDataAgendamento(format(date, 'yyyy-MM-dd'));
        setModalStep('time');
        generateHorarios(date);
    };

    const handleTimeSelect = (time) => {
        setHoraAgendamento(time);
        setShowModal(false);
        setModalStep('date');
    };

    const handlePrevMonth = () => {
        setCurrentMonth(prevMonth => addDays(prevMonth, -30));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addDays(prevMonth, 30));
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

            await updateDoc(clienteRef, {
                nome,
                email,
                dataAgendamento: dataHora
            });

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

                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            {dataAgendamento && horaAgendamento ? `${format(new Date(dataAgendamento), 'dd/MM/yyyy')} às ${horaAgendamento}` : 'Selecionar Data e Horário'}
                        </button>

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

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {modalStep === 'date' ? 'Selecione a Data' : 'Selecione o Horário'}
                                </h2>
                                <button onClick={() => {
                                    if (modalStep === 'time') {
                                        setModalStep('date');
                                    } else {
                                        setShowModal(false);
                                        setModalStep('date');
                                    }
                                }} className="text-gray-600 hover:text-gray-800">
                                    {modalStep === 'time' ? <FaArrowLeft size={24} /> : <FaTimes size={24} />}
                                </button>
                            </div>
                            
                            {modalStep === 'date' && (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <button onClick={handlePrevMonth} className="text-blue-500 hover:text-blue-700">
                                            &lt; Mês anterior
                                        </button>
                                        <h3 className="text-lg font-semibold text-gray-700">
                                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                                        </h3>
                                        <button onClick={handleNextMonth} className="text-blue-500 hover:text-blue-700">
                                            Próximo mês &gt;
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                            <div key={day} className="text-center font-semibold text-gray-600">{day}</div>
                                        ))}
                                        {generateCalendarDays().map((date, index) => (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => !isSunday(date) && handleDateSelect(date)}
                                                disabled={isSunday(date) || date < new Date()}
                                                className={`p-2 rounded ${
                                                    isSunday(date) || date < new Date()
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                }`}
                                            >
                                                {format(date, 'd')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {modalStep === 'time' && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                        Horários disponíveis para {format(selectedDate, 'dd/MM/yyyy')}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {horarios.map(({ time, isOccupied }) => (
                                            <button
                                                key={time}
                                                onClick={() => !isOccupied && handleTimeSelect(time)}
                                                disabled={isOccupied}
                                                className={`p-2 rounded ${
                                                    isOccupied
                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        : 'bg-blue-500 text-white hover:bg-blue-600'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default EditarCliente;
