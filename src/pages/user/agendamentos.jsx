import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import app from '../../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaEdit, FaTrashAlt, FaClock, FaTimes, FaCalendarTimes } from 'react-icons/fa';
import { format, addHours, isAfter, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateModal from '../../components/DateModal';
import TimeModal from '../../components/TimeModal';
import AppointmentCalendar from '../../components/AppointmentCalendar';
import Footer from '../../components/Footer';
import ConfirmationModal from '../../components/ConfirmationModal';
import SuccessModal from '../../components/SuccessModal';

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
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [confirmAction, setConfirmAction] = useState(null);
    const [selectedAgendamentoId, setSelectedAgendamentoId] = useState(null);
    const [updatedAgendamento, setUpdatedAgendamento] = useState(null);
    const [formattedDate, setFormattedDate] = useState('');

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
                    username: username
                };
            }));

            const now = new Date();
            const oneDayAgo = subDays(now, 1);
            const validAgendamentos = agendamentosList.filter(agendamento =>
                isAfter(agendamento.dataAgendamento.toDate(), oneDayAgo)
            );

            validAgendamentos.sort((a, b) => a.dataAgendamento.toDate() - b.dataAgendamento.toDate());
            setRecentAgendamento(validAgendamentos[0] || null);
            setAgendamentos(validAgendamentos);

            const events = validAgendamentos.map(agendamento => ({
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
        if (!date) return;

        setIsLoadingHorarios(true);
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Fetch occupied times for the selected date
            const q = query(
                collection(db, 'agendamentos'),
                where('dataAgendamento', '>=', startOfDay),
                where('dataAgendamento', '<=', endOfDay)
            );
            const querySnapshot = await getDocs(q);
            const occupiedTimes = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return format(data.dataAgendamento.toDate(), 'HH:mm');
            });

            // Generate all time slots
            const allSlots = [
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
                "16:00", "16:30", "17:00", "17:30"
            ];

            // Mark occupied slots
            const availableSlots = allSlots.map(time => ({
                time,
                isOccupied: occupiedTimes.includes(time)
            }));

            setHorarios(availableSlots);
            setScheduledTimes(occupiedTimes);
        } catch (error) {
            console.error('Error generating horarios:', error);
        } finally {
            setIsLoadingHorarios(false);
        }
    }, [db]);

    const handleEdit = (agendamento) => {   
        setSelectedAgendamento(agendamento);
        setNome(agendamento.nome);
        
        const date = agendamento.dataAgendamento.toDate();
        setDataAgendamento(format(date, 'yyyy-MM-dd'));
        setFormattedDate(format(date, 'dd/MM/yyyy', { locale: ptBR }));
        setSelectedDate(date);
        
        setHorario(format(date, 'HH:mm'));

        // Generate horarios for the selected date
        generateHorarios(date);

        // Scroll to the edit form
        setTimeout(() => {
            if (editFormRef.current) {
                editFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
        setFormattedDate(formattedDate);
        setDataAgendamento(format(date, 'yyyy-MM-dd'));
        generateHorarios(date);
        setShowDateModal(false);
        setShowTimeModal(true);  // Open TimeModal after date selection
    };

    const handleTimeSelect = (time) => {
        setHorario(time);
        setShowTimeModal(false);
    };

    const handleConfirmDelete = (agendamentoId) => {
        setSelectedAgendamentoId(agendamentoId);
        setConfirmAction('delete');
        setIsConfirmModalOpen(true);
    };

    const handleConfirmUpdate = (e) => {
        e.preventDefault();
        const selectedDate = new Date(`${dataAgendamento}T${horario}`);
        const now = new Date();

        if (selectedDate < now) {
            setFeedbackMessage('Não é possível agendar para uma data no passado.');
            return;
        }

        setUpdatedAgendamento({
            id: selectedAgendamento.id,
            nome,
            dataAgendamento: selectedDate
        });
        setConfirmAction('update');
        setIsConfirmModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (confirmAction === 'delete') {
            await handleCancel(selectedAgendamentoId);
        } else if (confirmAction === 'update') {
            await handleUpdate();
        }
        setIsConfirmModalOpen(false);
        setSelectedAgendamento(null);
        setNome('');
        setDataAgendamento('');
        setHorario('');
    };

    const handleUpdate = async () => {
        try {
            const agendamentoRef = doc(db, 'agendamentos', updatedAgendamento.id);
            await updateDoc(agendamentoRef, {
                nome: updatedAgendamento.nome,
                dataAgendamento: updatedAgendamento.dataAgendamento
            });
            setSuccessMessage('Seu agendamento foi atualizado com sucesso!');
            setIsSuccessModalOpen(true);
            await fetchAgendamentos(userEmail);
        } catch (error) {
            console.error('Erro ao atualizar o agendamento:', error);
            setFeedbackMessage('Erro ao atualizar o agendamento.');
        }
    };

    const handleCancel = async (agendamentoId) => {
        try {
            const agendamentoRef = doc(db, 'agendamentos', agendamentoId);
            await deleteDoc(agendamentoRef);
            setSuccessMessage('Seu agendamento foi cancelado com sucesso.');
            setIsSuccessModalOpen(true);
            await fetchAgendamentos(userEmail);
        } catch (error) {
            console.error('Erro ao cancelar o agendamento:', error);
            setFeedbackMessage('Erro ao cancelar o agendamento.');
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
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen flex flex-col items-center px-4 py-12">
            <motion.h1
                className="text-4xl md:text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Meus Agendamentos
            </motion.h1>

            <motion.button
                onClick={() => router.push('/user/cadastro')}
                className="mb-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300 ease-in-out transform hover:-translate-y-1"
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
                    className="w-full max-w-lg bg-gradient-to-br from-blue-800 to-indigo-900 p-8 rounded-3xl shadow-2xl mb-12 overflow-hidden relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 rounded-full transform translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 opacity-20 rounded-full transform -translate-x-12 translate-y-12"></div>
                    
                    <h2 className="text-3xl font-bold mb-6 flex items-center text-blue-200">
                        <FaCalendarAlt className="mr-3 text-blue-400" />
                        Próximo Agendamento
                    </h2>
                    
                    <div className="bg-blue-700 bg-opacity-30 p-6 rounded-xl backdrop-filter backdrop-blur-sm">
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <span className="text-blue-300 font-semibold w-24">Nome:</span>
                                <span className="text-white">{recentAgendamento.nome}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-blue-300 font-semibold w-24">Data:</span>
                                <span className="text-white">{format(recentAgendamento.dataAgendamento.toDate(), "dd 'de' MMMM", { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-blue-300 font-semibold w-24">Horário:</span>
                                <span className="text-white">{format(recentAgendamento.dataAgendamento.toDate(), "HH:mm 'h'", { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-blue-300 font-semibold w-24">Serviço:</span>
                                <span className="text-white">{getServiceName(recentAgendamento.servico)}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-blue-300 font-semibold w-24">Preço:</span>
                                <span className="text-white font-bold text-lg">{recentAgendamento.preco}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-blue-200 text-sm">
                            Seu próximo agendamento está confirmado. Aguardamos você!
                        </p>
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
                    <form onSubmit={handleConfirmUpdate}>
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
                                {formattedDate || 'Selecionar Data'}
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

            <AnimatePresence>
                {agendamentos.length > 0 && (
                    <motion.div
                        className="w-full max-w-lg"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">Todos os Agendamentos</h2>
                        {agendamentos.map((agendamento) => (
                            <motion.div
                                key={agendamento.id}
                                className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl shadow-xl mb-6 border border-gray-700"
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
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={() => handleEdit(agendamento)}
                                        className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 transition duration-300 ease-in-out"
                                    >
                                        <FaEdit className="mr-2 inline-block" /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleConfirmDelete(agendamento.id)}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 transition duration-300 ease-in-out"
                                    >
                                        <FaTrashAlt className="mr-2 inline-block" /> Cancelar
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-lg mt-8">
                <h2 className="text-2xl font-bold mb-4">Calendário de Agendamentos</h2>
                <AppointmentCalendar events={calendarEvents} />
            </div>

            <DateModal
                showModal={showDateModal}
                setShowModal={setShowDateModal}
                handleDateSelect={handleDateSelect}
                initialDate={selectedDate}
            />

            <TimeModal
                showModal={showTimeModal}
                setShowModal={setShowTimeModal}
                selectedDate={selectedDate}
                handleTimeSelect={handleTimeSelect}
                horarios={horarios}
                scheduledTimes={scheduledTimes}
                isLoadingHorarios={isLoadingHorarios}
                currentSelectedTime={horario}
            />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmAction}
                title={confirmAction === 'delete' ? 'Cancelar Agendamento' : 'Atualizar Agendamento'}
                message={confirmAction === 'delete'
                    ? 'Tem certeza que deseja cancelar este agendamento?'
                    : 'Tem certeza que deseja atualizar este agendamento?'}
                confirmText={confirmAction === 'delete' ? 'Cancelar Agendamento' : 'Atualizar Agendamento'}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                message={successMessage}
            />

            <Footer />
        </div>
    );
}

export default Agendamentos;