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
import { FaCalendarAlt, FaClock, FaUser, FaEnvelope, FaArrowLeft, FaCut, FaTimes } from 'react-icons/fa';
import { format, addDays, isSunday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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
        setPreco(servicoPrecosMap[servico] || '');
    }, [servico]);

    const generateHorarios = useCallback(async () => {
        if (!data) return;

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

            await addDoc(collection(db, "agendamentos"), {
                nome,
                email,
                dataAgendamento,
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
                    <div className="relative">
                        <FaUser className="absolute top-3 left-3 text-gray-400" />
                        <input
                            type="text"
                            id="nome"
                            placeholder="Nome do cliente"
                            className="w-full bg-gray-800 rounded-md border border-gray-700 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
                        <input
                            type="email"
                            id="email"
                            placeholder="Email do cliente"
                            className="w-full bg-gray-800 rounded-md border border-gray-700 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

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
                            className="w-full bg-gray-800 rounded-md border border-gray-700 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
