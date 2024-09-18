import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import app from '../../lib/firebase';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FaUsers, FaMoneyBillWave, FaChartPie } from 'react-icons/fa';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useRouter } from 'next/router';

// Registra os componentes necessários do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
    const [clientesAtendidos, setClientesAtendidos] = useState(0);
    const [clientesNaoAtendidos, setClientesNaoAtendidos] = useState(0);
    const [faturamentoProporcional, setFaturamentoProporcional] = useState(0);
    const [faturamentoEstimado, setFaturamentoEstimado] = useState(0);
    const [valorPorCliente, setValorPorCliente] = useState(30); // Valor padrão inicial
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    const fetchDashboardData = async () => {
        try {
            // Obtém o valor do corte do Firestore
            const settingsDoc = await getDoc(doc(db, 'barbearia', 'configuracao'));
            if (settingsDoc.exists()) {
                setValorPorCliente(settingsDoc.data().valorPorCorte || 30);
            }

            const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));

            // Obtém a data atual e a data limite (30 dias atrás)
            const currentDate = new Date();
            const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30));

            // Filtra os agendamentos com base na data
            const filteredDocs = agendamentosSnapshot.docs.filter(doc => {
                const data = doc.data();
                const appointmentDate = data.dataAgendamento.toDate(); // Supondo que a data está em um campo 'dataAgendamento' do tipo Timestamp
                return appointmentDate >= thirtyDaysAgo;
            });

            const atendidos = filteredDocs.filter(doc => doc.data().statusPagamento === 'Pago').length;
            const naoAtendidos = filteredDocs.filter(doc => doc.data().statusPagamento !== 'Pago').length;

            setClientesAtendidos(atendidos);
            setClientesNaoAtendidos(naoAtendidos);

            // Cálculo do faturamento proporcional e estimado
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

    // Prepara os dados para o gráfico de pizza
    const pieChartData = {
        labels: ['Atendidos', 'Não Atendidos'],
        datasets: [
            {
                label: 'Clientes',
                data: [clientesAtendidos, clientesNaoAtendidos],
                backgroundColor: ['#82ca9d', '#ff6384'],
                hoverBackgroundColor: ['#6fb387', '#ff4564'],
                borderColor: '#ffffff',
                borderWidth: 1,
            },
        ],
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

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center">
                        <FaChartPie className="text-4xl text-yellow-400" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">Faturamento Estimado</h2>
                            <p className="text-5xl font-semibold mt-2">R$ {faturamentoEstimado.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
                    <h2 className="text-2xl font-bold text-center mb-4">Proporção de Clientes</h2>
                    <div className="w-full h-80 max-w-full mx-auto">
                        <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </main>

            <Link href="/admin" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
}

export default Dashboard;
