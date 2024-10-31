import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaUser, FaEnvelope } from 'react-icons/fa';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, parseISO, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import DateModal from '../../components/DateModal';
import TimeModal from '../../components/TimeModal';
import Footer from '../../components/Footer';
import SuccessModal from '../../components/SuccessModal';

function Cadastro() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        data: '',
        horario: '',
        servico: '',
        preco: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [data, setData] = useState('');
    const [horarios, setHorarios] = useState([]);
    const [showDateModal, setShowDateModal] = useState(false);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [scheduledTimes, setScheduledTimes] = useState([]);
    const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formattedDate, setFormattedDate] = useState('');

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
        const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
        setFormattedDate(formattedDate);
        setData(format(date, 'yyyy-MM-dd'));
        generateHorarios(date);
        setShowDateModal(false);  // Fechar o modal de data
        setShowTimeModal(true);   // Abrir o modal de horário
    };

    const handleTimeSelect = (time) => {
        setFormData(prev => ({ ...prev, horario: time }));
        setShowTimeModal(false);
    };

    const generateHorarios = useCallback(async (date) => {
        if (!date) return;

        setIsLoadingHorarios(true);
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const q = query(
                collection(db, 'agendamentos'),
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
        } finally {
            setIsLoadingHorarios(false);
        }
    }, [db]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'servico') {
            setFormData(prev => ({ ...prev, preco: servicoPrecosMap[value] }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!formData.nome || !formattedDate || !formData.horario || !formData.servico) {
            const camposFaltantes = [];
        
            // Verifica cada campo e adiciona o nome à array se estiver vazio
            if (!formData.nome) camposFaltantes.push('Nome');
            if (!formattedDate) camposFaltantes.push('Data');
            if (!formData.horario) camposFaltantes.push('Horário');
            if (!formData.servico) camposFaltantes.push('Serviço');
        
            // Exibe no console os campos faltantes
            console.error('Campos obrigatórios faltando:', camposFaltantes.join(', '));
            console.log("data: ", formattedDate);
        
            // Define a mensagem de erro para o usuário
            setError('Preencha todos os campos obrigatórios!');
            return;
        }
    
        setLoading(true);
        setError('');
    
        try {
            // Obtém o dia, mês e ano da data formatada
            const [day, month, year] = formattedDate.split('/');
            const [hour, minute] = formData.horario.split(':');
            const timeZone = 'America/Sao_Paulo';
    
            // Cria a data final formatada
            const dataAgendamento = moment.tz(`${year}-${month}-${day} ${hour}:${minute}`, timeZone).toDate();
    
            const isTimeSlotTaken = scheduledTimes.some(time =>
                isEqual(parseISO(time), dataAgendamento)
            );
    
            if (isTimeSlotTaken) {
                setError('Este horário já está agendado. Por favor, escolha outro horário.');
                setLoading(false);
                return;
            }
    
            // Dados a serem salvos no banco
            const agendamentoData = {
                nome: formData.nome,
                dataAgendamento: Timestamp.fromDate(dataAgendamento),
                horaAgendamento: formData.horario,
                statusPagamento: "Pendente",
                servico: formData.servico,
                preco: formData.preco,
            };
    
            // Adiciona o email se ele estiver presente no formulário
            if (formData.email) {
                agendamentoData.email = formData.email;
            }
    
            // Salva o documento no Firestore
            await addDoc(collection(db, "agendamentos"), agendamentoData);
    
            setShowSuccessModal(true);
            setFormData({
                nome: '',
                email: '',
                data: '',
                horario: '',
                servico: '',
                preco: ''
            });
            setError('');
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
                                value={formData.nome}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email (opcional)</label>
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
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

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
                            {formData.horario || 'Selecionar Horário'}
                        </button>
                    </div>

                    <div>
                        <label htmlFor="servico" className="block text-sm font-medium text-gray-300">Serviço</label>
                        <select
                            id="servico"
                            name="servico"
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-700 text-white"
                            value={formData.servico}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Selecione o serviço</option>
                            <option value="corte_cabelo">Corte de Cabelo - R$ 35,00</option>
                            <option value="corte_barba">Corte de Barba - R$ 25,00</option>
                            <option value="corte_cabelo_barba">Corte de Cabelo e Barba - R$ 50,00</option>
                        </select>
                    </div>

                    {formData.servico && (
                        <div>
                            <div className="text-center text-lg font-semibold">
                                Preço: {formData.preco}
                            </div>
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

            <DateModal
                showModal={showDateModal}
                setShowModal={setShowDateModal}
                handleDateSelect={handleDateSelect}
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

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.push('/admin');
                }}
                message="Agendamento cadastrado com sucesso!"
                autoCloseTime={2000}
            />

            <Footer />
        </div>
    );
}

export default Cadastro;