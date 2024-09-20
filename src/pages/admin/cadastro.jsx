import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaCut, FaTimes, FaChevronLeft, FaChevronRight, FaUser, FaEnvelope } from 'react-icons/fa';
import { format, addMonths, subMonths, isSunday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, getDay, parseISO, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateTimeModal from '../../components/DateTimeModal';

function Cadastro() {
    const router = useRouter();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [data, setData] = useState('');
    const [horario, setHorario] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [servico, setServico] = useState('');
    const [preco, setPreco] = useState('');
    const [horarios, setHorarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState('date');
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduledTimes, setScheduledTimes] = useState([]);
    const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
    const [isLoadingScheduledTimes, setIsLoadingScheduledTimes] = useState(true);

    const servicoPrecosMap = {
        corte_cabelo: 'R$ 35,00',
        corte_barba: 'R$ 25,00',
        corte_cabelo_barba: 'R$ 50,00'
    };

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
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    useEffect(() => {
        fetchScheduledTimes();
    }, []);

    const fetchScheduledTimes = async () => {
        setIsLoadingScheduledTimes(true);
        try {
            const db = getFirestore(app);
            const appointmentsRef = collection(db, 'agendamentos');
            const querySnapshot = await getDocs(appointmentsRef);
            
            const times = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return data.dataAgendamento.toDate().toISOString();
            });
            
            setScheduledTimes(times);
        } catch (error) {
            console.error('Error fetching scheduled times:', error);
            // Handle the error appropriately
        } finally {
            setIsLoadingScheduledTimes(false);
        }
    };

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

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setData(format(date, 'yyyy-MM-dd'));
        setModalStep('time');
        generateHorarios();
    };

    const handleTimeSelect = (time) => {
        setHorario(time);
        setShowModal(false);
        setModalStep('date');
    };

    const generateHorarios = useCallback(async () => {
        if (!selectedDate) return;

        setIsLoadingHorarios(true);
        try {
            const db = getFirestore(app);
            const appointmentsRef = collection(db, 'agendamentos');
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(
                appointmentsRef,
                where("dataAgendamento", ">=", startOfDay),
                where("dataAgendamento", "<=", endOfDay)
            );

            const querySnapshot = await getDocs(q);
            const occupiedSlots = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return format(data.dataAgendamento.toDate(), 'HH:mm');
            });

            const allSlots = [
                "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
                "16:00", "16:30", "17:00", "17:30"
            ];

            const availableHorarios = allSlots.map(time => ({
                time,
                isOccupied: occupiedSlots.includes(time)
            }));

            setHorarios(availableHorarios);
        } catch (error) {
            console.error('Error generating horarios:', error);
            // Handle the error appropriately
        } finally {
            setIsLoadingHorarios(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        if (selectedDate) {
            generateHorarios();
        }
    }, [selectedDate, generateHorarios]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!nome || !email || !data || !horario || !servico) {
            setError('Preencha todos os campos!');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const [year, month, day] = data.split('-');
            const [hour, minute] = horario.split(':');
            const timeZone = 'America/Sao_Paulo';
            const dataAgendamento = moment.tz(`${year}-${month}-${day} ${hour}:${minute}`, timeZone).toDate();

            // Check if the appointment time is already taken
            const isTimeSlotTaken = scheduledTimes.some(time => 
                isEqual(parseISO(time), dataAgendamento)
            );

            if (isTimeSlotTaken) {
                setError('Este horário já está agendado. Por favor, escolha outro horário.');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "agendamentos"), {
                nome,
                email,
                dataAgendamento: Timestamp.fromDate(dataAgendamento),
                horaAgendamento: horario,
                statusPagamento: "Pendente",
                servico,
                preco,
            });

            alert('Agendamento cadastrado com sucesso!');
            setNome('');
            setEmail('');
            setData('');
            setHorario('');
            setServico('');
            setPreco('');
            setError('');
            router.push('/admin');
        } catch (error) {
            console.error('Erro ao cadastrar Agendamento:', error);
            setError('Erro ao cadastrar Agendamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen flex flex-col justify-center items-center px-4 py-10">
            <motion.div
                className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg shadow-xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.h1
                    className="text-3xl font-bold mb-6 text-center text-blue-300"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Novo Agendamento
                </motion.h1>

                {error && (
                    <motion.p
                        className="text-red-400 mb-4 text-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {error}
                    </motion.p>
                )}

                <motion.form
                    className="space-y-6"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-300">Nome</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaUser className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="nome"
                                id="nome"
                                className="bg-gray-700 text-white block w-full pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nome do cliente"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                className="bg-gray-700 text-white block w-full pl-10 pr-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="email@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        {data && horario ? `${format(new Date(data), 'dd/MM/yyyy')} às ${horario}` : 'Selecionar Data e Horário'}
                    </button>

                    {/* ... outros campos do formulário ... */}

                    <motion.button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                    >
                        {loading ? 'Cadastrando...' : 'Cadastrar Agendamento'}
                    </motion.button>
                </motion.form>
            </motion.div>
            
            <Link href="/admin" className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out shadow-lg">
                <FaArrowLeft />
            </Link>

            <DateTimeModal 
                showModal={showModal}
                setShowModal={setShowModal}
                modalStep={modalStep}
                setModalStep={setModalStep}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                handleDateSelect={handleDateSelect}
                handleTimeSelect={handleTimeSelect}
                horarios={horarios}
                generateCalendarDays={generateCalendarDays}
                scheduledTimes={scheduledTimes}
                isLoadingHorarios={isLoadingHorarios}
                isLoadingScheduledTimes={isLoadingScheduledTimes}
            />
        </div>
    );
}

export default Cadastro;
