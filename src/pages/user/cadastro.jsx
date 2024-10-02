import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaCut, FaCheckCircle } from 'react-icons/fa';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateModal from '../../components/DateModal';
import TimeModal from '../../components/TimeModal';
import Footer from '../../components/Footer';
// Importe o ToastContainer e toast do react-toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SuccessModal from '../../components/SuccessModal';
import { utcToZonedTime } from 'date-fns-tz';

function Cadastro() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [data, setData] = useState('');
    const [horario, setHorario] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [servico, setServico] = useState('');
    const [preco, setPreco] = useState('');
    const [horarios, setHorarios] = useState([]);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduledTimes, setScheduledTimes] = useState([]);
    const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
    const [isLoadingScheduledTimes, setIsLoadingScheduledTimes] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [formattedDate, setFormattedDate] = useState('');
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const modalRef = useRef(null);
    const [successMessage, setSuccessMessage] = useState('');

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
                setEmail(user.email);
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setNome(docSnap.data().username || '');
                }
            } else {
                router.push('/login');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    useEffect(() => {
        if (router.query.servico) {
            setServico(router.query.servico);
            setPreco(servicoPrecosMap[router.query.servico] || '');
        }
    }, [router.query.servico]);

    useEffect(() => {
        setPreco(servicoPrecosMap[servico] || '');
    }, [servico]);

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
        const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
        setFormattedDate(formattedDate);
        setData(format(date, 'yyyy-MM-dd'));
        fetchHorarios(date);
    };

    const handleTimeSelect = (time) => {
        setHorario(time);
    };

    const fetchHorarios = useCallback(async (date) => {
        setIsLoadingHorarios(true);
        try {
            const appointmentsRef = collection(db, 'agendamentos');
            const selectedDateString = format(date, 'yyyy-MM-dd');
            const startOfDay = new Date(selectedDateString);
            const endOfDay = new Date(selectedDateString);
            endOfDay.setDate(endOfDay.getDate() + 1);

            const q = query(
                appointmentsRef,
                where("dataAgendamento", ">=", startOfDay),
                where("dataAgendamento", "<", endOfDay)
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

            const updatedHorarios = allSlots.map(time => ({
                time,
                isOccupied: occupiedSlots.includes(time)
            }));

            setHorarios(updatedHorarios);
        } catch (error) {
            console.error('Error fetching horarios:', error);
        } finally {
            setIsLoadingHorarios(false);
        }
    }, [db]);

    useEffect(() => {
        fetchHorarios(selectedDate);
    }, [selectedDate, fetchHorarios]);

    useEffect(() => {
        fetchScheduledTimes();
    }, []);

    const fetchScheduledTimes = async () => {
        setIsLoadingScheduledTimes(true);
        try {
            const appointmentsRef = collection(db, 'agendamentos');
            const querySnapshot = await getDocs(appointmentsRef);

            const times = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return data.dataAgendamento.toDate().toISOString();
            });

            setScheduledTimes(times);
        } catch (error) {
            console.error('Error fetching scheduled times:', error);
        } finally {
            setIsLoadingScheduledTimes(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!data || !horario || !servico) {
            setError('Preencha todos os campos!');
            return;
        }

        setIsLoading(true);

        try {
            const [year, month, day] = data.split('-');
            const [hour, minute] = horario.split(':');
            const timeZone = 'America/Sao_Paulo';
            const dataAgendamento = moment.tz(`${year}-${month}-${day} ${hour}:${minute}`, timeZone).toDate();

            const isTimeSlotTaken = scheduledTimes.some(time =>
                isEqual(parseISO(time), dataAgendamento)
            );

            if (isTimeSlotTaken) {
                setError('Este horário já está agendado. Por favor, escolha outro horário.');
                setIsLoading(false);
                return;
            }

            await addDoc(collection(db, "agendamentos"), {
                nome,
                email,
                dataAgendamento: Timestamp.fromDate(dataAgendamento),
                horaAgendamento: horario,
                statusPagamento: 'Pendente',
                servico,
                preco,
            });

            setSuccessMessage('Agendamento realizado com sucesso!');
            setIsSuccessModalOpen(true);
            setTimeout(() => {
                setIsSuccessModalOpen(false);
                router.push('/user/agendamentos');
            }, 2000);

        } catch (error) {
            console.error('Erro ao cadastrar Agendamento:', error);
            setError('Erro ao cadastrar Agendamento. Tente novamente.');
            toast.error('Erro ao cadastrar Agendamento. Tente novamente.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen flex flex-col justify-center items-center px-4 py-12">
            {/* Adicione o ToastContainer ao seu componente */}
            <ToastContainer />

            <motion.div
                className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.h1
                    className="text-3xl font-bold mb-6 text-center"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Novo Agendamento
                </motion.h1>

                {error && (
                    <motion.p
                        className="text-red-500 mb-4 text-center"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {error}
                    </motion.p>
                )}

                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <motion.form
                        className="space-y-6"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={() => setShowDateModal(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                <FaCalendarAlt className="inline-block mr-2" />
                                {formattedDate || 'Selecionar Data'}
                            </button>
                            <button
                                type="button"
                                onClick={() => data && setShowTimeModal(true)}
                                className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105 ${!data ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!data}
                            >
                                <FaClock className="inline-block mr-2" />
                                {horario || 'Selecionar Horário'}
                            </button>
                        </div>

                        <div className="relative">
                            <FaCut className="absolute top-3 left-3 text-gray-400" />
                            <select
                                id="servico"
                                className="w-full bg-gray-700 rounded-md border border-gray-600 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                                value={servico}
                                onChange={(e) => setServico(e.target.value)}
                            >
                                <option value="">Selecione o serviço</option>
                                <option value="corte_cabelo">Corte de Cabelo - R$ 35,00</option>
                                <option value="corte_barba">Corte de Barba - R$ 25,00</option>
                                <option value="corte_cabelo_barba">Corte de Cabelo e Barba - R$ 50,00</option>
                            </select>
                        </div>

                        {preco && (
                            <div className="text-center text-lg font-semibold">
                                Preço: {preco}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Agendando...' : 'Agendar'}
                        </button>
                    </motion.form>
                )}
            </motion.div>

            <Link href="/" className="mt-8 inline-flex items-center text-blue-400 hover:text-blue-300 transition duration-300">
                <FaArrowLeft className="mr-2" />
                Voltar para a página inicial
            </Link>

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                message={successMessage}
                autoCloseTime={9000}
            />

            {(isLoadingScheduledTimes || isLoadingHorarios) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}

            <DateModal
                showModal={showDateModal}
                setShowModal={setShowDateModal}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                handleDateSelect={(date) => {
                    handleDateSelect(date);
                    setShowDateModal(false);
                    setShowTimeModal(true);
                }}
                generateCalendarDays={generateCalendarDays}
            />

            <TimeModal
                showModal={showTimeModal}
                setShowModal={setShowTimeModal}
                selectedDate={selectedDate}
                handleTimeSelect={(time) => {
                    handleTimeSelect(time);
                    setShowTimeModal(false);
                }}
                horarios={horarios}
                scheduledTimes={scheduledTimes}
                isLoadingHorarios={isLoadingHorarios}
            />

            <Footer />
        </div>
    );
}

export default Cadastro;