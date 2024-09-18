import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import { MdCheck, MdCancel, MdEdit, MdDelete } from 'react-icons/md';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function Agendamentos() {
    const [clientesPendentes, setClientesPendentes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [clientesPerPage] = useState(5);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null); // Estado para o papel do usuário
    const router = useRouter();
    const auth = getAuth();
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Pega o documento do usuário no Firestore
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setRole(userData.role);

                    if (userData.role !== 'admin') {
                        router.push('/'); // Redireciona se o papel não for admin
                    } else {
                        fetchClientesPendentes(); // Se o usuário for admin, carrega os dados
                    }
                } else {
                    console.log("Documento não encontrado.");
                }
            } else {
                router.push('/login'); // Redireciona se não estiver logado
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    useEffect(() => {
        fetchClientesPendentes();
    }, [statusFilter, searchTerm]); // Adicione statusFilter e searchTerm aqui

    const fetchClientesPendentes = async () => {
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
                statusPagamento: data.statusPagamento || 'Pendente',
                dataHoraUTC: dataHoraUTC // Adiciona dataHoraUTC para filtragem
            };
        });

        // Filtra agendamentos futuros e passados no intervalo de 30 dias
        const agora = moment().tz('America/Sao_Paulo');
        const trintaDiasAtras = moment().subtract(30, 'days');

        clientesData = clientesData.filter(cliente =>
            cliente.dataHoraUTC >= agora.toDate() || cliente.dataHoraUTC >= trintaDiasAtras.toDate()
        );

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

    const handleStatusChange = async (cliente, novoStatus) => {
        const clienteRef = doc(db, 'agendamentos', cliente.id);

        // Atualize o status do cliente
        await updateDoc(clienteRef, {
            statusPagamento: novoStatus
        });

        // Atualize o total financeiro com base na mudança de status
        const financeiroRef = doc(db, 'financeiro', 'total');
        const financeiroSnapshot = await getDoc(financeiroRef);

        // Se o status foi alterado para "Pago"
        if (novoStatus === 'Pago' && cliente.statusPagamento !== 'Pago') {
            if (financeiroSnapshot.exists()) {
                const totalAtual = financeiroSnapshot.data().total || 0;
                const valorCliente = cliente.valor || 30;  // Substitua 30 pelo valor padrão se não estiver definido
                await updateDoc(financeiroRef, {
                    total: totalAtual + valorCliente
                });
            } else {
                // Se o documento não existir, crie-o com o valor inicial do cliente
                const valorCliente = cliente.valor || 30;  // Substitua 30 pelo valor padrão se não estiver definido
                await setDoc(financeiroRef, {
                    total: valorCliente
                });
            }
        }

        // Se o status foi alterado para "Pendente"
        if (novoStatus === 'Pendente' && cliente.statusPagamento === 'Pago') {
            if (financeiroSnapshot.exists()) {
                const totalAtual = financeiroSnapshot.data().total || 0;
                const valorCliente = cliente.valor || 30;  // Substitua 30 pelo valor padrão se não estiver definido
                await updateDoc(financeiroRef, {
                    total: totalAtual - valorCliente
                });
            }
        }

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
            const clienteRef = doc(db, 'agendamentos', cliente.id);

            // Remover o cliente
            await deleteDoc(clienteRef);

            // Atualizar o total financeiro
            const financeiroRef = doc(db, 'financeiro', 'total');
            const financeiroSnapshot = await getDoc(financeiroRef);

            if (financeiroSnapshot.exists()) {
                const totalAtual = financeiroSnapshot.data().total || 0;
                const valorCliente = cliente.valor || 30;  // Substitua 30 pelo valor padrão se não estiver definido

                // Subtrair o valor do cliente do total
                const novoTotal = totalAtual - valorCliente;

                // Atualizar o total financeiro ou definir como 0 se o total for negativo
                await updateDoc(financeiroRef, {
                    total: Math.max(novoTotal, 0)
                });
            }

            fetchClientesPendentes(); // Atualiza a lista de clientes pendentes
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

    if (role === null) {
        return <LoadingSpinner />; // Mostre o spinner durante o carregamento da autenticação
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
            {loading ? (
                <LoadingSpinner /> // Mostre o spinner durante o carregamento
            ) : (
                <>
                    <main className="flex flex-col items-center justify-start space-y-4 mb-8 p-4">
                        <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
                        <div className="w-full max-w-screen-md p-6 bg-gray-800 rounded-lg shadow-lg">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 rounded bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none"
                                />
                            </div>
                            <Link href="/admin/cadastro" passHref>
                                <button className="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    Cadastrar Novo Cliente
                                </button>
                            </Link>

                            <div className="w-full max-w-screen-md p-4 bg-gray-800 rounded-lg shadow-lg mb-4">
                                <div className="flex justify-center space-x-4">
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('Todos')}
                                        className={`px-4 py-2 rounded-full ${statusFilter === 'Todos' ? 'bg-blue-600' : 'bg-gray-700'} hover:bg-blue-700 text-white font-bold focus:outline-none`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('Pendente')}
                                        className={`px-4 py-2 rounded-full ${statusFilter === 'Pendente' ? 'bg-red-600' : 'bg-gray-700'} hover:bg-red-700 text-white font-bold focus:outline-none`}
                                    >
                                        Pendentes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('Pago')}
                                        className={`px-4 py-2 rounded-full ${statusFilter === 'Pago' ? 'bg-green-600' : 'bg-gray-700'} hover:bg-green-700 text-white font-bold focus:outline-none`}
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
                                            className="mb-4 p-4 bg-gray-700 rounded-lg flex flex-col md:flex-row justify-between relative"
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
                                                    className={`px-4 py-2 rounded-full font-bold ${cliente.statusPagamento === 'Pendente' ? 'bg-red-600' : 'bg-green-600'}`}
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
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full"
                                                >
                                                    <MdEdit size={20} />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(cliente)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full"
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
                                                    className={`px-4 py-2 rounded-full ${currentPage === number ? 'bg-blue-600' : 'bg-gray-700'} text-white font-bold hover:bg-blue-700 focus:outline-none`}
                                                >
                                                    {number}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        </div>
                        <Link href="/admin" className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Voltar
                        </Link>
                    </main>
                </>
            )}
        </div>
    );
}

export default Agendamentos;
