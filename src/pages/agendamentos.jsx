import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import app from '../lib/firebase';
import Calendario from '../components/Calendario';
import Link from 'next/link';
import { useRouter } from 'next/router';
import moment from 'moment-timezone';
import { MdCheck, MdCancel, MdEdit, MdDelete } from 'react-icons/md';

function Agendamentos() {
    const [clientesPendentes, setClientesPendentes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [clientesPerPage] = useState(5);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [statusFilter, setStatusFilter] = useState('Todos'); // Novo estado para o filtro
    const router = useRouter();

    // Função para buscar clientes pendentes com status de pagamento
    const fetchClientesPendentes = async () => {
        const db = getFirestore(app);
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        let clientesData = agendamentosSnapshot.docs.map(doc => {
            const data = doc.data();
            const dataHoraUTC = data.dataAgendamento.toDate();
            const timeZone = 'America/Sao_Paulo'; // Ajuste o fuso horário conforme necessário
            const dataHoraLocal = moment.tz(dataHoraUTC, timeZone);

            return {
                id: doc.id, // ID do documento para atualizações
                nome: data.nome,
                email: data.email,
                dataAgendamento: dataHoraLocal.format('DD/MM/YYYY'),
                horaAgendamento: dataHoraLocal.format('HH:mm'),
                statusPagamento: data.statusPagamento || 'Pendente' // Define o status de pagamento inicial
            };
        });

        // Aplicar filtro
        if (statusFilter !== 'Todos') {
            clientesData = clientesData.filter(cliente => cliente.statusPagamento === statusFilter);
        }

        setClientesPendentes(clientesData);
    };

    useEffect(() => {
        fetchClientesPendentes(); // Carrega os clientes ao montar o componente
    }, [statusFilter]); // Recarrega os clientes quando o filtro mudar

    // Função para alterar o status de pagamento
    const handleStatusChange = async (cliente, novoStatus) => {
        const db = getFirestore(app);
        const clienteRef = doc(db, 'agendamentos', cliente.id);
        await updateDoc(clienteRef, {
            statusPagamento: novoStatus
        });
        setSelectedCliente(null); // Fechar a lista de seleção ao alterar
        fetchClientesPendentes(); // Atualizar a lista de clientes
    };

    // Função para alternar a visibilidade da lista de status
    const toggleStatusList = (cliente) => {
        if (selectedCliente && selectedCliente.id === cliente.id) {
            setSelectedCliente(null); // Fecha a lista se o mesmo cliente for clicado novamente
        } else {
            setSelectedCliente(cliente); // Abre a lista para o cliente clicado
        }
    };

    // Função para navegar para a página de edição
    const handleEdit = (cliente) => {
        router.push(`/editar/${cliente.id}`);
    };

    // Função para excluir um cliente
    const handleDelete = async (cliente) => {
        if (confirm(`Você tem certeza que deseja excluir o cliente ${cliente.nome}?`)) {
            const db = getFirestore(app);
            const clienteRef = doc(db, 'agendamentos', cliente.id);
            await deleteDoc(clienteRef);
            fetchClientesPendentes(); // Atualiza a lista de clientes após a exclusão
        }
    };

    // Função para alterar a página atual
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Calcula os índices de início e fim dos clientes a serem exibidos
    const indexOfLastCliente = currentPage * clientesPerPage;
    const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
    const currentClientes = clientesPendentes.slice(indexOfFirstCliente, indexOfLastCliente);

    // Calcula o número total de páginas
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(clientesPendentes.length / clientesPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Link href="/" className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>

            <header className="py-4 px-6 text-center">
                <h1 className="text-2xl font-bold">Agendamentos</h1>
            </header>

            {/* Lista de Clientes Pendentes */}
            <main className="flex flex-col items-center justify-start space-y-4">
                <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg">

                    <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg mb-4">
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setStatusFilter('Todos')}
                                className={`px-4 py-2 rounded-full ${statusFilter === 'Todos' ? 'bg-blue-500' : 'bg-gray-700'} hover:bg-blue-700 text-white font-bold`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setStatusFilter('Pendente')}
                                className={`px-4 py-2 rounded-full ${statusFilter === 'Pendente' ? 'bg-red-500' : 'bg-gray-700'} hover:bg-red-700 text-white font-bold`}
                            >
                                Pendentes
                            </button>
                            <button
                                onClick={() => setStatusFilter('Pago')}
                                className={`px-4 py-2 rounded-full ${statusFilter === 'Pago' ? 'bg-green-500' : 'bg-gray-700'} hover:bg-green-700 text-white font-bold`}
                            >
                                Pagos
                            </button>
                        </div>
                    </div>
                    <ul>
                        {currentClientes.map((cliente, index) => (
                            <li key={index} className="mb-4 p-2 bg-gray-800 rounded-lg flex justify-between items-center">
                                <div>
                                    <p><strong>Nome:</strong> {cliente.nome}</p>
                                    <p><strong>Email:</strong> {cliente.email}</p>
                                    <p><strong>Data:</strong> {cliente.dataAgendamento}</p>
                                    <p><strong>Hora:</strong> {cliente.horaAgendamento}</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Botão de Status de Pagamento */}
                                    <button
                                        className={`px-4 py-2 rounded-full font-bold ${cliente.statusPagamento === 'Pendente' ? 'bg-red-500' : 'bg-green-500'}`}
                                        onClick={() => toggleStatusList(cliente)}
                                    >
                                        {cliente.statusPagamento === 'Pendente' ? (
                                            <MdCancel size={24} />
                                        ) : (
                                            <MdCheck size={24} />
                                        )}
                                    </button>

                                    {/* Mostra opções de status quando o cliente é clicado */}
                                    {selectedCliente && selectedCliente.id === cliente.id && (
                                        <div className="mt-2 bg-gray-700 p-2 rounded-lg">
                                            <p onClick={() => handleStatusChange(cliente, 'Pendente')} className="cursor-pointer hover:bg-gray-600 p-2 flex items-center space-x-2">
                                                <MdCancel size={20} />
                                                <span>Pendente</span>
                                            </p>
                                            <p onClick={() => handleStatusChange(cliente, 'Pago')} className="cursor-pointer hover:bg-gray-600 p-2 flex items-center space-x-2">
                                                <MdCheck size={20} />
                                                <span>Pago</span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Botão de Edição */}
                                    <button
                                        onClick={() => handleEdit(cliente)}
                                        className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-full flex items-center space-x-2"
                                    >
                                        <MdEdit size={20} />
                                    </button>

                                    {/* Botão de Exclusão */}
                                    <button
                                        onClick={() => handleDelete(cliente)}
                                        className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-700 text-white font-bold rounded-full flex items-center space-x-2"
                                    >
                                        <MdDelete size={20} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Controles de Navegação */}
                <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg flex justify-center space-x-2">
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-4 py-2 rounded-full ${currentPage === number ? 'bg-blue-500' : 'bg-gray-700'} hover:bg-blue-700 text-white font-bold`}
                        >
                            {number}
                        </button>
                    ))}
                </div>

                {/* Calendário */}
                <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg">
                    <Calendario />
                </div>
            </main>
        </div>
    );
}

export default Agendamentos;
