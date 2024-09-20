import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaCut, FaTimes } from 'react-icons/fa';
import { format, addDays, isSunday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

function Cadastro() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [data, setData] = useState('');
    const [horario, setHorario] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [nome, setNome] = useState('');
    const [servico, setServico] = useState('');
    const [preco, setPreco] = useState('');
    const [horarios, setHorarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalStep, setModalStep] = useState('date'); // 'date' or 'time'
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

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
                setIsAuthenticated(true);
                setEmail(user.email);

                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setNome(userData.username || '');
                } else {
                    console.log("Documento não encontrado.");
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

    const getCurrentDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const generateHorarios = useCallback(async () => {
        if (!data) return; // Add this check

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

        // Fetch existing appointments for the selected date
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        const agendamentos = agendamentosSnapshot.docs.map(doc => doc.data());

        const availableHorarios = generatedHorarios.map(time => {
            const [hour, minute] = time.split(':');
            const dateTime = new Date(data);
            dateTime.setHours(parseInt(hour), parseInt(minute));

            const isOccupied = agendamentos.some(agendamento => {
                const agendamentoDate = agendamento.dataAgendamento.toDate();
                return agendamentoDate.getTime() === dateTime.getTime();
            });

            return { time, isOccupied };
        });

        setHorarios(availableHorarios);
        console.log('Generated horarios:', availableHorarios); // Add this for debugging
    }, [data, db]);

    useEffect(() => {
        generateHorarios();
    }, [generateHorarios]);

    const generateCalendarDays = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    };

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

    const handlePrevMonth = () => {
        setCurrentMonth(prevMonth => addDays(prevMonth, -30));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addDays(prevMonth, 30));
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

            await addDoc(collection(db, "agendamentos"), {
                nome,
                email,
                dataAgendamento,
                horaAgendamento: horario,
                statusPagamento: 'Pendente',
                servico,
                preco,
            });

            alert('Agendamento cadastrado com sucesso!');
            setData('');
            setHorario('');
            setServico('');
            setPreco('');
            setError('');
            router.push('/');
        } catch (error) {
            console.error('Erro ao cadastrar Agendamento:', error);
            setError('Erro ao cadastrar Agendamento. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen flex flex-col justify-center items-center px-4 py-12">
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
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            {data && horario ? `${format(new Date(data), 'dd/MM/yyyy')} às ${horario}` : 'Selecionar Data e Horário'}
                        </button>

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

export default Cadastro;
