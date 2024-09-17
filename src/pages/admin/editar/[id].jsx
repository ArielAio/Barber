import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import Link from 'next/link';
import app from '../../../lib/firebase';
import moment from 'moment-timezone';

function EditarCliente() {
    const router = useRouter();
    const { id } = router.query;
    const [cliente, setCliente] = useState(null);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [dataAgendamento, setDataAgendamento] = useState('');
    const [horaAgendamento, setHoraAgendamento] = useState('');
    const [error, setError] = useState('');

    // Função para buscar os dados do cliente
    const fetchCliente = async () => {
        if (!id) return;

        const db = getFirestore(app);
        const clienteRef = doc(db, 'agendamentos', id);
        const clienteDoc = await getDoc(clienteRef);

        if (clienteDoc.exists()) {
            const data = clienteDoc.data();
            const dataHora = data.dataAgendamento.toDate();
            setCliente(data);
            setNome(data.nome);
            setEmail(data.email);
            setDataAgendamento(moment(dataHora).format('YYYY-MM-DD')); // Formatando a data
            setHoraAgendamento(moment(dataHora).format('HH:mm')); // Formatando a hora
        }
    };

    useEffect(() => {
        fetchCliente(); // Carrega os dados ao montar o componente
    }, [id]);

    const checkAvailability = async (start, end) => {
        const db = getFirestore(app);
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));

        return agendamentosSnapshot.docs.every(doc => {
            const data = doc.data();
            const existingStart = data.dataAgendamento.toDate();
            const existingEnd = new Date(existingStart.getTime() + 30 * 60000); // Define o final como 30 minutos após o início

            // Verifica se o novo horário se sobrepõe a algum agendamento existente
            return end <= existingStart || start >= existingEnd;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        try {
            // Combina a data e a hora
            const [ano, mes, dia] = dataAgendamento.split('-').map(Number);
            const [hora, minuto] = horaAgendamento.split(':').map(Number);

            // Ajuste o fuso horário conforme necessário
            const timeZone = 'America/Sao_Paulo';
            const dataHora = moment.tz({ year: ano, month: mes - 1, day: dia, hour: hora, minute: minuto }, timeZone).toDate();

            // Calcula o início e o fim do novo agendamento
            const newStart = dataHora;
            const newEnd = new Date(newStart.getTime() + 30 * 60000);

            // Verifica se o horário está disponível
            const isAvailable = await checkAvailability(newStart, newEnd);

            if (!isAvailable) {
                setError('O horário selecionado não está disponível. Escolha outro horário.');
                return;
            }

            const db = getFirestore(app);
            const clienteRef = doc(db, 'agendamentos', id);

            await updateDoc(clienteRef, {
                nome,
                email,
                dataAgendamento: dataHora // Atualiza a data e hora
            });

            alert('Dados do cliente atualizados com sucesso!');
            router.push('/agendamentos'); // Navega de volta para a lista de clientes
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            alert('Erro ao atualizar cliente. Tente novamente.');
        }
    };

    if (!cliente) return <p>Carregando...</p>;

    return (
        <div className="min-h-screen flex flex-col bg-black text-white">
            <Link href="/agendamentos" className="absolute top-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>

            <header className="py-4 px-6 text-center">
                <h1 className="text-2xl font-bold">Editar Cliente</h1>
            </header>

            {/* Formulário de Edição */}
            <main className="flex flex-col items-center justify-center space-y-4">
                <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg">
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="nome" className="block text-sm mb-1">Nome:</label>
                            <input
                                type="text"
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full rounded-md border text-black border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm mb-1">Email:</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-md border text-black border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="data" className="block text-sm mb-1">Data:</label>
                            <input
                                type="date"
                                id="data"
                                value={dataAgendamento}
                                onChange={(e) => setDataAgendamento(e.target.value)}
                                className="w-full rounded-md border text-black border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="hora" className="block text-sm mb-1">Horário:</label>
                            <input
                                type="time"
                                id="hora"
                                value={horaAgendamento}
                                onChange={(e) => setHoraAgendamento(e.target.value)}
                                className="w-full rounded-md border text-black border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Atualizar
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default EditarCliente;
