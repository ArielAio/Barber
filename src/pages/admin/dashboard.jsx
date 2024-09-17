import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../../lib/firebase';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement } from 'chart.js';
import { FaUsers, FaMoneyBillWave, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRouter } from 'next/router';

const VALOR_POR_CLIENTE = 30; // Valor padrão por cliente

// Registra os componentes necessários do Chart.js
ChartJS.register(LineElement, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement);

function Dashboard() {
    const [clientesAtendidos, setClientesAtendidos] = useState(0);
    const [rendimentos, setRendimentos] = useState([]);
    const [totalRendimentos, setTotalRendimentos] = useState(0);
    const [variacao, setVariacao] = useState(0);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    const fetchDashboardData = async () => {
        try {
            const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
            const clientesPagos = agendamentosSnapshot.docs.filter(doc => doc.data().statusPagamento === 'Pago');
            setClientesAtendidos(clientesPagos.length);

            const financeiroSnapshot = await getDocs(collection(db, 'financeiro'));
            const rendimentosData = financeiroSnapshot.docs.map(doc => ({
                data: doc.id,
                total: doc.data().total,
            }));

            const total = rendimentosData.reduce((acc, curr) => acc + curr.total, 0);
            setTotalRendimentos(total);

            if (rendimentosData.length >= 2) {
                const penultimo = rendimentosData[rendimentosData.length - 2].total;
                const ultimo = rendimentosData[rendimentosData.length - 1].total;
                const percentChange = ((ultimo - penultimo) / penultimo) * 100;
                setVariacao(percentChange);
            }

            setRendimentos(rendimentosData);
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
                    setRole(userData.role);

                    if (userData.role === 'admin') {
                        fetchDashboardData();
                    } else {
                        router.push('/'); // Redireciona se o papel não for admin
                    }
                } else {
                    console.log("Documento não encontrado.");
                }
            } else {
                router.push('/login'); // Redireciona se não estiver logado
            }
        });

        return () => unsubscribe();
    }, [auth, db]);

    // Cálculo do faturamento proporcional
    const faturamentoProporcional = clientesAtendidos * VALOR_POR_CLIENTE;

    // Prepara os dados para o gráfico
    const chartData = {
        labels: rendimentos.map(r => r.data),
        datasets: [
            {
                label: 'Faturamento',
                data: rendimentos.map(r => r.total),
                borderColor: '#82ca9d',
                backgroundColor: 'rgba(130, 202, 157, 0.3)',
                borderWidth: 2,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context) => `R$ ${context.raw.toLocaleString('pt-BR')}`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#fff',
                },
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: '#fff',
                },
            },
        },
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-8">
            <header className="py-4 text-center">
                <h1 className="text-4xl font-extrabold">Dashboard Financeiro</h1>
                <p className="mt-2 text-gray-400">Acompanhe seus rendimentos e clientes atendidos</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center">
                        <FaUsers className="text-4xl text-blue-400" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">Clientes Atendidos</h2>
                            <p className="text-5xl font-semibold mt-2">{clientesAtendidos}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center">
                        <FaMoneyBillWave className="text-4xl text-green-400" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">Faturamento Proporcional</h2>
                            <p className="text-5xl font-semibold mt-2">R$ {faturamentoProporcional.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                <div className={`bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 ${variacao >= 0 ? 'border-green-400' : 'border-red-400'} border-l-4`}>
                    <div className="flex items-center">
                        {variacao >= 0 ? (
                            <FaArrowUp className="text-4xl text-green-400" />
                        ) : (
                            <FaArrowDown className="text-4xl text-red-400" />
                        )}
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">Variação de Rendimentos</h2>
                            <p className={`text-4xl font-semibold mt-2 ${variacao >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {variacao.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
                    <h2 className="text-2xl font-bold text-center mb-4">Rendimentos ao Longo do Tempo</h2>
                    <Line data={chartData} options={chartOptions} />
                </div>
            </main>
            <Link href="/admin" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
}

export default Dashboard;
