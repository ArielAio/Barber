import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FaCalendarAlt, FaClock, FaUser, FaEnvelope, FaArrowLeft, FaCut } from 'react-icons/fa';

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

    const getCurrentDate = () => {
        return new Date().toISOString().split('T')[0];
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
            const dataFimAgendamento = new Date(dataAgendamento.getTime() + 30 * 60000);

            const agora = new Date();

            if (dataAgendamento <= agora) {
                setError('Não é possível agendar para uma data e hora no passado.');
                setLoading(false);
                return;
            }

            const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
            const agendamentos = agendamentosSnapshot.docs.map(doc => doc.data());

            const isTimeAvailable = agendamentos.every(agendamento => {
                const start = new Date(agendamento.dataAgendamento.toDate());
                const end = new Date(start.getTime() + 30 * 60000);
                return (dataFimAgendamento <= start || dataAgendamento >= end);
            });

            if (!isTimeAvailable) {
                setError('Horário já ocupado. Escolha outro intervalo.');
                setLoading(false);
                return;
            }

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

                    <div className="relative">
                        <FaCalendarAlt className="absolute top-3 left-3 text-gray-400" />
                        <input
                            type="date"
                            id="data"
                            className="w-full bg-gray-800 rounded-md border border-gray-700 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            min={getCurrentDate()}
                        />
                    </div>

                    <div className="relative">
                        <FaClock className="absolute top-3 left-3 text-gray-400" />
                        <input
                            type="time"
                            id="horario"
                            className="w-full bg-gray-800 rounded-md border border-gray-700 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                            value={horario}
                            onChange={(e) => setHorario(e.target.value)}
                        />
                    </div>

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
        </div>
    );
}

export default Cadastro;
