import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import app from '../../lib/firebase';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaUsers, FaMoneyBillWave, FaChartPie, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
    const [clientesAtendidos, setClientesAtendidos] = useState(0);
    const [clientesNaoAtendidos, setClientesNaoAtendidos] = useState(0);
    const [faturamentoProporcional, setFaturamentoProporcional] = useState(0);
    const [faturamentoEstimado, setFaturamentoEstimado] = useState(0);
    const [valorPorCliente, setValorPorCliente] = useState(30);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    const fetchDashboardData = async () => {
        try {
            const settingsDoc = await getDoc(doc(db, 'barbearia', 'configuracao'));
            if (settingsDoc.exists()) {
                setValorPorCliente(settingsDoc.data().valorPorCorte || 30);
            }

            const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));

            const currentDate = new Date();
            const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30));

            const filteredDocs = agendamentosSnapshot.docs.filter(doc => {
                const data = doc.data();
                const appointmentDate = data.dataAgendamento.toDate();
                return appointmentDate >= thirtyDaysAgo;
            });

            const atendidos = filteredDocs.filter(doc => doc.data().statusPagamento === 'Pago').length;
            const naoAtendidos = filteredDocs.filter(doc => doc.data().statusPagamento !== 'Pago').length;

            setClientesAtendidos(atendidos);
            setClientesNaoAtendidos(naoAtendidos);

            const proportional = atendidos * valorPorCliente;
            const estimated = (atendidos + naoAtendidos) * valorPorCliente;
            setFaturamentoProporcional(proportional);
            setFaturamentoEstimado(estimated);

        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();

                    if (userData.role === 'admin') {
                        fetchDashboardData();
                    } else {
                        router.push('/');
                    }
                } else {
                    console.log("Documento não encontrado.");
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, db]);

    const doughnutChartData = {
        labels: ['Atendidos', 'Não Atendidos'],
        datasets: [
            {
                data: [clientesAtendidos, clientesNaoAtendidos],
                backgroundColor: ['#10B981', '#F59E0B'],
                hoverBackgroundColor: ['#059669', '#D97706'],
                borderWidth: 0,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        size: 14,
                        family: "'Inter', sans-serif",
                    },
                    color: '#E5E7EB',
                },
            },
        },
        cutout: '70%',
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4 sm:p-8">
            <motion.header 
                className="py-4 text-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                    Dashboard Financeiro
                </h1>
                <p className="mt-2 text-gray-300">Acompanhe seus rendimentos e clientes atendidos</p>
            </motion.header>

            <AnimatePresence>
                <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                >
                    {[
                        { title: "Clientes Atendidos", value: clientesAtendidos, icon: FaUsers, color: "blue" },
                        { title: "Faturamento Proporcional", value: `R$ ${faturamentoProporcional.toLocaleString('pt-BR')}`, icon: FaMoneyBillWave, color: "green" },
                        { title: "Faturamento Estimado", value: `R$ ${faturamentoEstimado.toLocaleString('pt-BR')}`, icon: FaChartPie, color: "yellow" }
                    ].map((item, index) => (
                        <motion.div 
                            key={index}
                            className={`bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-semibold text-gray-300">{item.title}</h2>
                                    <item.icon className={`text-2xl text-${item.color}-400`} />
                                </div>
                                <p className="text-3xl font-bold">{item.value}</p>
                            </div>
                            <div className={`bg-${item.color}-500 h-1`}></div>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            <motion.div 
                className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-2xl font-bold text-center mb-6">Proporção de Clientes</h2>
                <div className="w-full h-64 sm:h-80">
                    <Doughnut data={doughnutChartData} options={doughnutOptions} />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
            >
                <Link href="/admin" className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                    <FaArrowLeft className="mr-2" />
                    Voltar
                </Link>
            </motion.div>
        </div>
    );
}

export default Dashboard;
