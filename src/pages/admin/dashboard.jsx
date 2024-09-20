import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from '../../lib/firebase';
import { useRouter } from 'next/router';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import LoadingSpinner from '../../components/LoadingSpinner';
import moment from 'moment-timezone';
import { FaMoneyBillWave, FaChartLine, FaCalendarCheck, FaChartBar } from 'react-icons/fa';
import Footer from '../../components/Footer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const router = useRouter();
    const auth = getAuth(app);
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().role === 'admin') {
                    setRole('admin');
                    fetchAppointments();
                } else {
                    router.push('/');
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    const fetchAppointments = async () => {
        const appointmentsSnapshot = await getDocs(collection(db, 'agendamentos'));
        const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day');
        
        const appointmentsData = appointmentsSnapshot.docs
            .map(doc => {
                const data = doc.data();
                const appointmentDate = moment(data.dataAgendamento.toDate());
                return {
                    ...data,
                    id: doc.id,
                    preco: data.preco ? parseFloat(data.preco.replace('R$', '').replace(',', '.')) : 0,
                    statusPagamento: data.statusPagamento || 'Pendente',
                    dataAgendamento: appointmentDate
                };
            })
            .filter(appointment => appointment.dataAgendamento.isAfter(thirtyDaysAgo));

        setAppointments(appointmentsData);
        setLoading(false);
    };

    const currentRevenue = appointments
        .filter(appointment => appointment.statusPagamento === 'Pago')
        .reduce((sum, appointment) => sum + appointment.preco, 0);

    const estimatedRevenue = appointments.reduce((sum, appointment) => sum + appointment.preco, 0);

    const totalRevenue = appointments.reduce((sum, appointment) => sum + appointment.preco, 0);
    const averagePrice = totalRevenue / appointments.length || 0;

    const serviceCount = appointments.reduce((acc, appointment) => {
        acc[appointment.servico] = (acc[appointment.servico] || 0) + 1;
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(serviceCount).map(getServiceName),
        datasets: [
            {
                label: 'Número de Agendamentos',
                data: Object.values(serviceCount),
                backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)'],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Agendamentos por Tipo de Serviço',
            },
        },
    };

    function getServiceName(serviceId) {
        const serviceNames = {
            corte_cabelo: 'Corte de Cabelo',
            corte_barba: 'Corte de Barba',
            corte_cabelo_barba: 'Corte de Cabelo e Barba'
        };
        return serviceNames[serviceId] || 'Serviço não especificado';
    }

    if (role === null || loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center">
                <FaChartLine className="mr-2" /> Dashboard
            </h1>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-2 flex items-center">
                        <FaMoneyBillWave className="mr-2 text-green-400" /> Faturamento Atual
                    </h2>
                    <p className="text-3xl font-bold">R$ {currentRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-2 flex items-center">
                        <FaChartLine className="mr-2 text-blue-400" /> Faturamento Estimado
                    </h2>
                    <p className="text-3xl font-bold">R$ {estimatedRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-2 flex items-center">
                        <FaCalendarCheck className="mr-2 text-yellow-400" /> Total de Agendamentos
                    </h2>
                    <p className="text-3xl font-bold">{appointments.length}</p>
                </div>
            </div>

            <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FaChartBar className="mr-2 text-purple-400" /> Agendamentos por Tipo de Serviço
                </h2>
                <div className="w-full h-[300px] md:h-[400px]">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Dashboard;