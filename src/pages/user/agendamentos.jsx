// pages/user/agendamentos.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import app from '../../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaEdit, FaTrashAlt, FaChevronLeft, FaClock, FaArrowLeft, FaTimes, FaCalendarTimes } from 'react-icons/fa';
import { format, addDays, isSunday, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, parseISO, addHours, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateModal from '../../components/DateModal';
import TimeModal from '../../components/TimeModal';
import AppointmentCalendar from '../../components/AppointmentCalendar';
import Footer from '../../components/Footer';

function Agendamentos() {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recentAgendamento, setRecentAgendamento] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [selectedAgendamento, setSelectedAgendamento] = useState(null);
    const [nome, setNome] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');
    const [horario, setHorario] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [horarios, setHorarios] = useState([]);
    const [scheduledTimes, setScheduledTimes] = useState([]);
    const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [editingAgendamentoId, setEditingAgendamentoId] = useState(null);
    const editFormRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserEmail(user.email);
                await fetchAgendamentos(user.email);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    const fetchAgendamentos = async (email) => {
        try {
            const q = query(collection(db, 'agendamentos'), where('email', '==', email));
            const agendamentosSnapshot = await getDocs(q);

            // Buscar o usuário correspondente
            const userQuery = query(collection(db, 'users'), where('email', '==', email));
            const userSnapshot = await getDocs(userQuery);
            let username = '';
            if (!userSnapshot.empty) {
                username = userSnapshot.docs[0].data().username || '';
            }

            const agendamentosList = await Promise.all(agendamentosSnapshot.docs.map(async (doc) => {
                const agendamentoData = doc.data();
                return {
                    id: doc.id,
                    ...agendamentoData,
                    username: username // Adicionar o username ao objeto do agendamento
                };
            }));

            const now = new Date();
            const futureAgendamentos = agendamentosList.filter(agendamento =>
                isAfter(agendamento.dataAgendamento.toDate(), now)
            );

            futureAgendamentos.sort((a, b) => a.dataAgendamento.toDate() - b.dataAgendamento.toDate());
            setRecentAgendamento(futureAgendamentos[0] || null);
            setAgendamentos(agendamentosList);

            // Atualizar os eventos do calendário com o nome de usuário
            const events = agendamentosList.map(agendamento => ({
                title: getServiceName(agendamento.servico),
                start: agendamento.dataAgendamento.toDate(),
                end: addHours(agendamento.dataAgendamento.toDate(), 1),
                allDay: false,
                userName: agendamento.username || 'Usuário'
            }));
            setCalendarEvents(events);
        } catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCalendarDays = useCallback(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });
        const startDay = getDay(start);
        const previousMonthDays = Array(startDay).fill(null).map((_, index) => {
            return subDays(start, startDay - index);
        });
        return [...previousMonthDays.reverse(), ...days];
    }, [currentMonth]);

    const generateHorarios = useCallback(async (date) => {
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

        const scheduledTimesArray = agendamentos.map(agendamento =>
            agendamento.dataAgendamento.toDate().toISOString()
        );
        setScheduledTimes(scheduledTimesArray);

        const availableHorarios = generatedHorarios.map(time => {
            const [hour, minute] = time.split(':');
            const dateTime = date ? new Date(date) : new Date();
            dateTime.setHours(parseInt(hour), parseInt(minute));

            const isOccupied = agendamentos.some(agendamento => {
                if (agendamento.id === editingAgendamentoId) return false; // Exclude the current appointment
                const agendamentoDate = agendamento.dataAgendamento.toDate();
                return agendamentoDate.getTime() === dateTime.getTime();
            });

            return { time, isOccupied };
        });

        setHorarios(availableHorarios);
        setIsLoadingHorarios(false);
    }, [db, editingAgendamentoId]);

    const handleEdit = (agendamento) => {
        // If the clicked appointment is already being edited, close it
        if (editingAgendamentoId === agendamento.id) {
            setSelectedAgendamento(null);
            setEditingAgendamentoId(null);
            setNome('');
            setDataAgendamento('');
            setHorario('');
            setSelectedDate(null);
        } else {
            // Close the current editing form (if any) and open the new one
            setSelectedAgendamento(agendamento);
            setEditingAgendamentoId(agendamento.id);
            setNome(agendamento.nome);
            setDataAgendamento(format(agendamento.dataAgendamento.toDate(), 'yyyy-MM-dd'));
            setHorario(format(agendamento.dataAgendamento.toDate(), 'HH:mm'));
            setSelectedDate(agendamento.dataAgendamento.toDate());
            setCurrentMonth(agendamento.dataAgendamento.toDate());
            generateHorarios(agendamento.dataAgendamento.toDate());

            // Use setTimeout to ensure the form is rendered before scrolling
            setTimeout(() => {
                if (editFormRef.current) {
                    editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setDataAgendamento(format(date, 'yyyy-MM-dd'));
        setShowDateModal(false);
        setShowTimeModal(true);
        generateHorarios(date);
    };

    const handleTimeSelect = (time) => {
        setHorario(time);
        setShowTimeModal(false);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const selectedDate = new Date(`${dataAgendamento}T${horario}`);
        const now = new Date();

        if (selectedDate < now) {
            setFeedbackMessage('Não é possível agendar para uma data no passado.');
            return;
        }

        if (window.confirm('Tem certeza que deseja atualizar este agendamento?')) {
            try {
                const agendamentoRef = doc(db, 'agendamentos', selectedAgendamento.id);
                const timeZone = 'America/Sao_Paulo';
                const dataAgendamentoMoment = new Date(`${dataAgendamento}T${horario}`);

                await updateDoc(agendamentoRef, {
                    nome,
                    dataAgendamento: dataAgendamentoMoment
                });
                setSelectedAgendamento(null);
                setNome('');
                setDataAgendamento('');
                setHorario('');
                setFeedbackMessage('Agendamento atualizado com sucesso!');
                await fetchAgendamentos(userEmail);
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
                await fetchAgendamentos(userEmail);

                // Clear the feedback message after 5 seconds
                setProgress(0);
                progressIntervalRef.current = setInterval(() => {
                    setProgress((prev) => {
                        if (prev >= 100) {
                            clearInterval(progressIntervalRef.current);
                            setFeedbackMessage('');
                            return 100;
                        }
                        return prev + 2;
                    });
                }, 100);
            } catch (error) {
                console.error('Erro ao cancelar o agendamento:', error);
                setFeedbackMessage('Erro ao cancelar o agendamento.');
            }
        }
    };

    const handleCloseFeedback = () => {
        setFeedbackMessage('');
        clearInterval(progressIntervalRef.current);
    };

    const getServiceName = (serviceId) => {
        const serviceNames = {
            corte_cabelo: 'Corte de Cabelo',
            corte_barba: 'Corte de Barba',
            corte_cabelo_barba: 'Corte de Cabelo e Barba'
        };
        return serviceNames[serviceId] || serviceId;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen flex flex-col items-center px-4 py-8">
            <motion.h1
                className="text-3xl md:text-4xl font-bold mb-8 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Meus Agendamentos
            </motion.h1>

            {/* New button for creating an appointment */}
            <motion.button
                onClick={() => router.push('/user/cadastro')}
                className="mb-8 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300 ease-in-out"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <FaCalendarAlt className="inline-block mr-2" />
                Novo Agendamento
            </motion.button>

            {feedbackMessage && (
                <motion.div
                    className="w-full max-w-lg bg-opacity-80 bg-green-500 p-4 rounded-lg shadow-lg mb-8 text-center relative"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <div className="absolute top-0 left-0 h-1 bg-green-700" style={{ width: `${progress}%` }}></div>
                    <button
                        onClick={handleCloseFeedback}
                        className="absolute top-0 right-0 mt-2 mr-2 text-white"
                    >
                        <FaTimes />
                    </button>
                    {feedbackMessage}
                </motion.div>
            )}

            {recentAgendamento && (
                <motion.div
                    className="w-full max-w-lg bg-opacity-90 bg-blue-800 p-6 rounded-lg shadow-lg mb-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-4 flex items-center">
                        <FaCalendarAlt className="mr-2 text-blue-400" />
                        Próximo Agendamento
                    </h2>
                    <div className="bg-blue-700 bg-opacity-50 p-4 rounded-lg">
                        <p className="mb-2 text-lg"><strong>Nome:</strong> {recentAgendamento.nome}</p>
                        <p className="mb-2 text-lg"><strong>Data e Hora:</strong> {format(recentAgendamento.dataAgendamento.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                        <p className="mb-2 text-lg"><strong>Serviço:</strong> {getServiceName(recentAgendamento.servico)}</p>
                        <p className="mb-2 text-lg"><strong>Preço:</strong> {recentAgendamento.preco}</p>
                    </div>
                </motion.div>
            )}

            {agendamentos.length === 0 && (
                <motion.div
                    className="w-full max-w-lg bg-opacity-90 bg-red-600 p-6 rounded-lg shadow-lg mb-8 text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <div className="flex flex-col items-center">
                        <FaCalendarTimes className="text-6xl mb-4 text-red-200" />
                        <h3 className="text-2xl font-bold mb-2">Nenhum Agendamento</h3>
                        <p className="text-lg text-red-100">
                            Você ainda não possui agendamentos cadastrados.
                        </p>
                        <button 
                            onClick={() => router.push('/user/cadastro')}
                            className="mt-4 bg-white text-red-600 font-bold py-2 px-4 rounded-full hover:bg-red-100 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-300"
                        >
                            Agendar Agora
                        </button>
                    </div>
                </motion.div>
            )}

            {selectedAgendamento && (
                <motion.div
                    ref={editFormRef}
                    className="w-full max-w-lg bg-opacity-90 bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
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
                        <div className="flex space-x-4 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowDateModal(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <FaCalendarAlt className="inline-block mr-2" />
                                {dataAgendamento ? format(new Date(dataAgendamento), 'dd/MM/yyyy') : 'Selecionar Data'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTimeModal(true);
                                    if (!dataAgendamento) {
                                        generateHorarios(new Date());
                                    }
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <FaClock className="inline-block mr-2" />
                                {horario || 'Selecionar Horário'}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        >
                            Atualizar Agendamento
                        </button>
                    </form>
                </motion.div>
            )}

            {agendamentos.length > 0 && (
                <motion.div
                    className="w-full max-w-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold mb-4">Todos os Agendamentos</h2>
                    {agendamentos.map((agendamento) => (
                        <motion.div
                        admin          key={agendamento.id}
                            className="bg-opacity-90 bg-gray-800 p-4 rounded-lg shadow-lg mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="mb-2 md:mb-0">
                                    <p className="font-bold text-lg">{agendamento.nome}</p>
                                    <p className="text-sm text-gray-300">{format(agendamento.dataAgendamento.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-sm">{getServiceName(agendamento.servico)}</p>
                                    <p className="font-bold text-yellow-400">{agendamento.preco}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end space-x-2">
                                <button
                                    onClick={() => handleEdit(agendamento)}
                                    className={`${editingAgendamentoId === agendamento.id
                                        ? 'bg-gray-500 hover:bg-gray-600'
                                        : 'bg-yellow-500 hover:bg-yellow-600'
                                        } text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400`}
                                >
                                    <FaEdit className="mr-2 inline-block" /> Editar
                                </button>
                                <button
                                    onClick={() => handleCancel(agendamento.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                                >
                                    <FaTrashAlt className="mr-2 inline-block" /> Cancelar
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            <div className="w-full max-w-lg mt-8">
                <h2 className="text-2xl font-bold mb-4">Calendário de Agendamentos</h2>
                <AppointmentCalendar events={calendarEvents} />
            </div>

            <DateModal
                showModal={showDateModal}
                setShowModal={setShowDateModal}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                admin={selectedDate}
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
            <Footer />
        </div>
    );
}

export default Agendamentos;
