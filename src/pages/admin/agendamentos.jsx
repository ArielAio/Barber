import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import { MdCheck, MdCancel, MdEdit, MdDelete, MdSearch, MdAdd, MdFilterList, MdExpandMore, MdExpandLess } from 'react-icons/md';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../../components/Footer';

function Agendamentos() {
    const [clientesPendentes, setClientesPendentes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [clientesPerPage] = useState(10);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [servicosData, setServicosData] = useState({});
    const [expandedClientes, setExpandedClientes] = useState({});
    const [showPastAppointments, setShowPastAppointments] = useState(false);
    const [showFutureAppointments, setShowFutureAppointments] = useState(true);
    const router = useRouter();
    const auth = getAuth(app);
    const db = getFirestore(app);

    const fetchClientesPendentes = useCallback(async () => {
        const settingsDoc = await getDoc(doc(db, 'barbearia', 'configuracao'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            setServicosData({
                corte_cabelo: { nome: 'Corte de Cabelo', preco: data.precoCorte || '35,00' },
                corte_barba: { nome: 'Corte de Barba', preco: data.precoBarba || '25,00' },
                corte_cabelo_barba: { nome: 'Corte de Cabelo e Barba', preco: data.precoCabeloBarba || '50,00' },
            });
        }

        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        let clientesData = agendamentosSnapshot.docs.map(doc => {
            const data = doc.data();
            const dataHoraUTC = data.dataAgendamento.toDate();
            const timeZone = 'America/Sao_Paulo';
            const dataHoraLocal = moment.tz(dataHoraUTC, timeZone);
            const now = moment();

            return {
                id: doc.id,
                nome: data.nome,
                email: data.email,
                dataAgendamento: dataHoraLocal.format('DD/MM/YYYY'),
                horaAgendamento: dataHoraLocal.format('HH:mm'),
                statusPagamento: data.statusPagamento || 'Pendente',
                servico: data.servico,
                preco: data.preco,
                dataHoraUTC: dataHoraUTC,
                isConcluido: moment(dataHoraUTC).isBefore(now)
            };
        });

        if (statusFilter !== 'Todos') {
            clientesData = clientesData.filter(cliente => cliente.statusPagamento === statusFilter);
        }

        if (searchTerm) {
            clientesData = clientesData.filter(cliente =>
                cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        const now = moment();
        if (showPastAppointments) {
            clientesData = clientesData.filter(cliente => moment(cliente.dataHoraUTC).isBefore(now));
        } else if (showFutureAppointments) {
            clientesData = clientesData.filter(cliente => moment(cliente.dataHoraUTC).isAfter(now));
        }

        const groupedClientes = clientesData.reduce((acc, cliente) => {
            if (!acc[cliente.email]) {
                acc[cliente.email] = [];
            }
            acc[cliente.email].push(cliente);
            return acc;
        }, {});

        Object.values(groupedClientes).forEach(group => {
            group.sort((a, b) => a.dataHoraUTC - b.dataHoraUTC);
        });

        setClientesPendentes(groupedClientes);
        setLoading(false);
    }, [statusFilter, searchTerm, showPastAppointments, showFutureAppointments, db]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().role === 'admin') {
                    setRole('admin');
                    fetchClientesPendentes();
                } else {
                    router.push('/');
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, db, router, fetchClientesPendentes]);

    const handleStatusChange = async (cliente, novoStatus) => {
        const clienteRef = doc(db, 'agendamentos', cliente.id);
        await updateDoc(clienteRef, { statusPagamento: novoStatus });
        setSelectedCliente(null);
        fetchClientesPendentes();
    };

    const handleEdit = (cliente) => {
        router.push(`/admin/editar/${cliente.id}`);
    };

    const handleDelete = async (cliente) => {
        if (confirm(`Você tem certeza que deseja excluir o cliente ${cliente.nome}?`)) {
            await deleteDoc(doc(db, 'agendamentos', cliente.id));
            fetchClientesPendentes();
        }
    };

    const indexOfLastCliente = currentPage * clientesPerPage;
    const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
    const currentClientes = Object.values(clientesPendentes).slice(indexOfFirstCliente, indexOfLastCliente);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const getServiceName = (serviceId) => {
        const serviceNames = {
            corte_cabelo: 'Corte de Cabelo',
            corte_barba: 'Corte de Barba',
            corte_cabelo_barba: 'Corte de Cabelo e Barba'
        };
        return serviceNames[serviceId] || 'Serviço não especificado';
    };

    const formatPreco = (preco) => {
        if (typeof preco === 'string') {
            return preco.startsWith('R$') ? preco : `R$ ${preco}`;
        }
        if (typeof preco === 'number') {
            return `R$ ${preco.toFixed(2).replace('.', ',')}`;
        }
        return 'Preço não especificado';
    };

    const toggleExpand = (email, date) => {
        const key = `${email}-${date}`;
        setExpandedClientes(prevState => ({
            ...prevState,
            [key]: !prevState[key]
        }));
    };

    const groupByDateAndEmail = (clientes) => {
        return clientes.reduce((acc, cliente) => {
            const date = moment(cliente.dataHoraUTC).format('dddd, DD [de] MMMM');
            const email = cliente.email;
            if (!acc[date]) {
                acc[date] = {};
            }
            if (!acc[date][email]) {
                acc[date][email] = [];
            }
            acc[date][email].push(cliente);
            return acc;
        }, {});
    };

    if (role === null) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4 md:p-8 flex flex-col">
            <div className="flex-grow">
                <h1 className="text-3xl font-bold mb-6 text-center">Agendamentos</h1>

                <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Pesquisar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-2 pl-10 rounded-full bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>

                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center justify-center w-full md:w-auto px-4 py-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-300"
                    >
                        <MdFilterList className="mr-2" />
                        Filtrar
                    </button>
                </div>

                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 flex flex-wrap justify-center gap-4"
                        >
                            <div className="flex flex-col items-center md:items-start">
                                <h3 className="text-lg font-semibold mb-2">Status de Pagamento</h3>
                                <div className="flex gap-2">
                                    {['Todos', 'Pendente', 'Pago'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={`px-4 py-2 rounded-full ${statusFilter === status
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                } transition-colors duration-300`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <h3 className="text-lg font-semibold mb-2">Data do Agendamento</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowPastAppointments(!showPastAppointments);
                                            if (showFutureAppointments) setShowFutureAppointments(false);
                                        }}
                                        className={`px-4 py-2 rounded-full ${showPastAppointments
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            } transition-colors duration-300`}
                                    >
                                        {showPastAppointments ? 'Mostrar Passados' : 'Mostrar Passados'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowFutureAppointments(!showFutureAppointments);
                                            if (showPastAppointments) setShowPastAppointments(false);
                                        }}
                                        className={`px-4 py-2 rounded-full ${showFutureAppointments
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            } transition-colors duration-300`}
                                    >
                                        {showFutureAppointments ? 'Mostrar Futuros' : 'Mostrar Futuros'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading ? (
                    <LoadingSpinner />
                ) : Object.keys(clientesPendentes).length === 0 ? (
                    <p className="text-center text-gray-400">Nenhum agendamento encontrado.</p>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupByDateAndEmail(Object.values(clientesPendentes).flat())).map(([date, clientesByEmail]) => (
                            <div key={date} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                                <h2 className="text-lg font-semibold mb-2 text-gray-300">{date}</h2>
                                <div className="space-y-4">
                                    {Object.entries(clientesByEmail).map(([email, clientes]) => {
                                        const key = `${email}-${date}`;
                                        return (
                                            <div key={email} className="bg-gray-700 p-4 rounded-lg">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                                    <div className="flex flex-col items-start">
                                                        <h3 className="text-xl font-semibold">{clientes[0].nome}</h3>
                                                        <p className="text-gray-400">{email}</p>
                                                    </div>
                                                    {clientes.length > 1 && (
                                                        <button
                                                            onClick={() => toggleExpand(email, date)}
                                                            className="p-2 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors duration-300"
                                                        >
                                                            {expandedClientes[key] ? <MdExpandLess size={20} /> : <MdExpandMore size={20} />}
                                                        </button>
                                                    )}
                                                </div>
                                                {expandedClientes[key] || clientes.length === 1 ? (
                                                    <div className="mt-4 space-y-4">
                                                        {clientes.map((cliente) => (
                                                            <div key={cliente.id} className="bg-gray-600 p-4 rounded-lg">
                                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                                                    <div className="flex flex-col items-start">
                                                                        <p className="text-gray-400">{cliente.horaAgendamento}</p>
                                                                        <p className="text-gray-400">Serviço: {getServiceName(cliente.servico)}</p>
                                                                        <p className="text-gray-400">Preço: {formatPreco(cliente.preco)}</p>
                                                                        <p className="text-gray-400">Status: {cliente.statusPagamento}</p>
                                                                    </div>
                                                                    <div className="flex space-x-2 items-center mt-2 md:mt-0">
                                                                        {cliente.isConcluido && (
                                                                            <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                                                                Concluído
                                                                            </span>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleStatusChange(cliente, cliente.statusPagamento === 'Pago' ? 'Pendente' : 'Pago')}
                                                                            className={`p-2 rounded-full ${cliente.statusPagamento === 'Pago' ? 'bg-green-500' : 'bg-yellow-500'
                                                                                } hover:opacity-80 transition-opacity duration-300`}
                                                                        >
                                                                            {cliente.statusPagamento === 'Pago' ? <MdCheck size={20} /> : <MdCancel size={20} />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleEdit(cliente)}
                                                                            className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors duration-300"
                                                                        >
                                                                            <MdEdit size={20} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDelete(cliente)}
                                                                            className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors duration-300"
                                                                        >
                                                                            <MdDelete size={20} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 flex justify-center">
                    {Array.from({ length: Math.ceil(Object.keys(clientesPendentes).length / clientesPerPage) }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => paginate(i + 1)}
                            className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                                } transition-colors duration-300`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>

                <Link href="/admin/cadastro" className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-full shadow-lg transition-colors duration-300">
                    <MdAdd size={24} />
                </Link>
            </div>
            <Footer />
        </div>
    );
}

export default Agendamentos;
