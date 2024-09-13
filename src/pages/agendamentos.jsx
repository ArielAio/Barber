import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import app from '../lib/firebase';
import { useRouter } from 'next/router';
import moment from 'moment-timezone';
import { MdCheck, MdCancel, MdEdit, MdDelete } from 'react-icons/md';
import LoadingSpinner from '../components/LoadingSpinner'; // Importe o componente
import Link from 'next/link';
import { motion } from 'framer-motion'; // Importe o Framer Motion

function Agendamentos() {
    const [clientesPendentes, setClientesPendentes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [clientesPerPage] = useState(5);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState(''); // Estado para armazenar o texto da pesquisa
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const router = useRouter();

    const fetchClientesPendentes = async () => {
        // setLoading(true); // Inicie o carregamento
        const db = getFirestore(app);
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        let clientesData = agendamentosSnapshot.docs.map(doc => {
            const data = doc.data();
            const dataHoraUTC = data.dataAgendamento.toDate();
            const timeZone = 'America/Sao_Paulo';
            const dataHoraLocal = moment.tz(dataHoraUTC, timeZone);

            return {
                id: doc.id,
                nome: data.nome,
                email: data.email,
                dataAgendamento: dataHoraLocal.format('DD/MM/YYYY'),
                horaAgendamento: dataHoraLocal.format('HH:mm'),
                statusPagamento: data.statusPagamento || 'Pendente'
            };
        });

        // Filtra por status
        if (statusFilter !== 'Todos') {
            clientesData = clientesData.filter(cliente => cliente.statusPagamento === statusFilter);
        }

        // Filtra pelo nome
        if (searchTerm) {
            clientesData = clientesData.filter(cliente =>
                cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setClientesPendentes(clientesData);
        setLoading(false); // Termine o carregamento
    };

    useEffect(() => {
        fetchClientesPendentes();
    }, [statusFilter, searchTerm]); // Adiciona searchTerm às dependências

    const handleStatusChange = async (cliente, novoStatus) => {
        const db = getFirestore(app);
        const clienteRef = doc(db, 'agendamentos', cliente.id);
        await updateDoc(clienteRef, {
            statusPagamento: novoStatus
        });
        setSelectedCliente(null);
        fetchClientesPendentes();
    };

    const toggleStatusList = (cliente) => {
        if (selectedCliente && selectedCliente.id === cliente.id) {
            setSelectedCliente(null);
        } else {
            setSelectedCliente(cliente);
        }
    };

    const handleEdit = (cliente) => {
        router.push(`/editar/${cliente.id}`);
    };

    const handleDelete = async (cliente) => {
        if (confirm(`Você tem certeza que deseja excluir o cliente ${cliente.nome}?`)) {
            const db = getFirestore(app);
            const clienteRef = doc(db, 'agendamentos', cliente.id);
            await deleteDoc(clienteRef);
            fetchClientesPendentes();
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const indexOfLastCliente = currentPage * clientesPerPage;
    const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
    const currentClientes = clientesPendentes.slice(indexOfFirstCliente, indexOfLastCliente);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(clientesPendentes.length / clientesPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            {loading ? (
                <LoadingSpinner /> // Mostre o spinner durante o carregamento
            ) : (
                <>
                    <header className="py-4 px-6 text-center">
                        <h1 className="text-2xl font-bold">Agendamentos</h1>
                    </header>

                    <main className="flex flex-col items-center justify-start space-y-4">
                        <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
                                />
                            </div>

                            <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg mb-4">
                                <div className="flex justify-center space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('Todos')}
                                        className={`px-4 py-2 rounded-full ${statusFilter === 'Todos' ? 'bg-blue-500' : 'bg-gray-700'} hover:bg-blue-700 text-white font-bold`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('Pendente')}
                                        className={`px-4 py-2 rounded-full ${statusFilter === 'Pendente' ? 'bg-red-500' : 'bg-gray-700'} hover:bg-red-700 text-white font-bold`}
                                    >
                                        Pendentes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('Pago')}
                                        className={`px-4 py-2 rounded-full ${statusFilter === 'Pago' ? 'bg-green-500' : 'bg-gray-700'} hover:bg-green-700 text-white font-bold`}
                                    >
                                        Pagos
                                    </button>
                                </div>
                            </div>

                            {clientesPendentes.length === 0 ? (
                                <p className="text-center text-gray-400">Nenhum agendamento cadastrado.</p>
                            ) : (
                                <ul>
                                    {currentClientes.map((cliente, index) => (
                                        <motion.li
                                            key={index}
                                            className="mb-4 p-4 bg-gray-800 rounded-lg flex flex-col md:flex-row justify-between relative"
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                        >
                                            <div className="mb-4 md:mb-0">
                                                <p><strong>Nome:</strong> {cliente.nome}</p>
                                                <p><strong>Email:</strong> {cliente.email}</p>
                                                <p><strong>Data:</strong> {cliente.dataAgendamento}</p>
                                                <p><strong>Hora:</strong> {cliente.horaAgendamento} - {moment(cliente.horaAgendamento, 'HH:mm').add(30, 'minutes').format('HH:mm')}</p>
                                            </div>

                                            <div className="flex items-center flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    className={`px-4 py-2 rounded-full font-bold ${cliente.statusPagamento === 'Pendente' ? 'bg-red-500' : 'bg-green-500'}`}
                                                    onClick={() => toggleStatusList(cliente)}
                                                >
                                                    {cliente.statusPagamento === 'Pendente' ? (
                                                        <MdCancel size={24} />
                                                    ) : (
                                                        <MdCheck size={24} />
                                                    )}
                                                </button>

                                                {selectedCliente && selectedCliente.id === cliente.id && (
                                                    <motion.div
                                                        className="absolute top-full mt-2 bg-gray-700 p-2 rounded-lg w-48 z-10"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <p onClick={() => handleStatusChange(cliente, 'Pendente')} className="cursor-pointer hover:bg-gray-600 p-2 flex items-center space-x-2">
                                                            <MdCancel size={20} />
                                                            <span>Pendente</span>
                                                        </p>
                                                        <p onClick={() => handleStatusChange(cliente, 'Pago')} className="cursor-pointer hover:bg-gray-600 p-2 flex items-center space-x-2">
                                                            <MdCheck size={20} />
                                                            <span>Pago</span>
                                                        </p>
                                                    </motion.div>
                                                )}

                                                <button
                                                    onClick={() => handleEdit(cliente)}
                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-full"
                                                >
                                                    <MdEdit size={20} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(cliente)}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded-full"
                                                >
                                                    <MdDelete size={20} />
                                                </button>
                                            </div>
                                        </motion.li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex justify-center mt-4">
                                <nav>
                                    <ul className="flex space-x-2">
                                        {pageNumbers.map(number => (
                                            <li key={number}>
                                                <button
                                                    type="button"
                                                    onClick={() => paginate(number)}
                                                    className={`px-4 py-2 rounded-full ${currentPage === number ? 'bg-blue-500' : 'bg-gray-700'} text-white font-bold hover:bg-blue-700`}
                                                >
                                                    {number}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                        <Link href="/" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Voltar
                        </Link>
                    </main>
                </>
            )}
        </div>
    );
}

export default Agendamentos;
