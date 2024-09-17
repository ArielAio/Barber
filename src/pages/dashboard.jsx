import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import app from '../lib/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaMoneyBillWave, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Link from 'next/link';

function Dashboard() {
    const [clientesAtendidos, setClientesAtendidos] = useState(0);
    const [rendimentos, setRendimentos] = useState([]);
    const [totalRendimentos, setTotalRendimentos] = useState(0);
    const [variacao, setVariacao] = useState(0);

    // Função para buscar os dados do Firestore
    const fetchDashboardData = async () => {
        const db = getFirestore(app);

        // 1. Buscar quantidade de clientes atendidos (status: 'Pago')
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        const clientesPagos = agendamentosSnapshot.docs.filter(doc => doc.data().statusPagamento === 'Pago');
        setClientesAtendidos(clientesPagos.length);

        // 2. Buscar rendimentos da coleção 'financeiro'
        const financeiroSnapshot = await getDocs(collection(db, 'financeiro'));
        const rendimentosData = financeiroSnapshot.docs.map(doc => ({
            data: doc.id,  // Pode ser uma data ou uma referência de período
            total: doc.data().total,
        }));

        // 3. Calcular o total de rendimentos a partir dos dados do gráfico (somar todos os 'total')
        const total = rendimentosData.reduce((acc, curr) => acc + curr.total, 0);
        setTotalRendimentos(total);

        // 4. Calcular variação percentual
        if (rendimentosData.length >= 2) {
            const penultimo = rendimentosData[rendimentosData.length - 2].total;
            const ultimo = rendimentosData[rendimentosData.length - 1].total;
            const percentChange = ((ultimo - penultimo) / penultimo) * 100;
            setVariacao(percentChange);
        }

        setRendimentos(rendimentosData);
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white p-8">
            <header className="py-4 text-center">
                <h1 className="text-4xl font-extrabold">Dashboard Financeiro</h1>
                <p className="mt-2 text-gray-400">Acompanhe seus rendimentos e clientes atendidos</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                {/* Card de Clientes Atendidos */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center">
                        <FaUsers className="text-4xl text-blue-400" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">Clientes Atendidos</h2>
                            <p className="text-5xl font-semibold mt-2">{clientesAtendidos}</p>
                        </div>
                    </div>
                </div>

                {/* Card de Total de Rendimentos */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center">
                        <FaMoneyBillWave className="text-4xl text-green-400" />
                        <div className="ml-4">
                            <h2 className="text-2xl font-bold">Total de Rendimentos</h2>
                            <p className="text-5xl font-semibold mt-2">R$ {totalRendimentos.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>

                {/* Card de Variação de Rendimentos */}
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

                {/* Gráfico de linha de rendimentos */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-lg mt-6">
                    <h2 className="text-2xl font-bold text-center mb-4">Rendimentos ao Longo do Tempo</h2>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={rendimentos}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                            <XAxis dataKey="data" tick={{ fill: '#fff' }} />
                            <YAxis tick={{ fill: '#fff' }} />
                            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" dataKey="total" stroke="#82ca9d" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </main>
            <Link href="/" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
}

export default Dashboard;
