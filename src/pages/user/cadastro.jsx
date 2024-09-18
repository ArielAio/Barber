import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';
import app from '../../lib/firebase';
import moment from 'moment-timezone';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function Cadastro() {
    const router = useRouter();
    const [email, setEmail] = useState(''); // Email será preenchido automaticamente
    const [data, setData] = useState('');
    const [horario, setHorario] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [nome, setNome] = useState(''); // Nome será preenchido automaticamente

    const auth = getAuth();
    const db = getFirestore(app);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsAuthenticated(true);
                setEmail(user.email); // Preenche o email automaticamente

                // Busca informações adicionais do usuário, incluindo o nome
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setNome(userData.username || ''); // Preenche o nome automaticamente
                } else {
                    console.log("Documento não encontrado.");
                }
            } else {
                router.push('/login'); // Redireciona se não estiver logado
            }
        });

        return () => unsubscribe();
    }, [auth, db, router]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!data || !horario) {
            alert('Preencha todos os campos!');
            return;
        }

        setLoading(true);

        try {
            const [year, month, day] = data.split('-');
            const [hour, minute] = horario.split(':');
            const timeZone = 'America/Sao_Paulo';
            const dataAgendamento = moment.tz(`${year}-${month}-${day} ${hour}:${minute}`, timeZone).toDate();
            const dataFimAgendamento = new Date(dataAgendamento.getTime() + 30 * 60000);

            // Data e hora atuais
            const agora = new Date();

            // Verifica se a data do agendamento é anterior à data atual
            if (dataAgendamento <= agora) {
                setError('Não é possível agendar para uma data e hora no passado.');
                setLoading(false);
                return;
            }

            const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
            const agendamentos = agendamentosSnapshot.docs.map(doc => doc.data());

            const isTimeAvailable = agendamentos.every(agendamento => {
                const start = new Date(agendamento.dataAgendamento.toDate());
                const end = new Date(start.getTime() + 30 * 60000);
                return (dataFimAgendamento <= start || dataAgendamento >= end);
            });

            if (!isTimeAvailable) {
                setError('Horário já ocupado. Escolha outro intervalo.');
                setLoading(false);
                return;
            }

            await addDoc(collection(db, "agendamentos"), {
                nome,
                email,
                dataAgendamento,
                horaAgendamento: horario,
            });

            alert('Agendamento cadastrado com sucesso!');
            setData('');
            setHorario('');
            setError('');
            router.push('/');
        } catch (error) {
            console.error('Erro ao cadastrar Agendamento:', error);
            alert('Erro ao cadastrar Agendamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return <LoadingSpinner />; // Mostre o spinner durante o carregamento da autenticação
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center px-4">
            <motion.h1
                className="text-2xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Cadastrar Agendamento
            </motion.h1>

            {error && (
                <motion.p
                    className="text-red-500 mb-4"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {error}
                </motion.p>
            )}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <motion.form
                    className="w-full max-w-sm space-y-4"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div>
                        <label htmlFor="data" className="block text-sm mb-1">Data:</label>
                        <input
                            type="date"
                            id="data"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="horario" className="block text-sm mb-1">Horário:</label>
                        <input
                            type="time"
                            id="horario"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            value={horario}
                            onChange={(e) => setHorario(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Cadastrar
                    </button>
                </motion.form>
            )}

            <Link href="/" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
}

export default Cadastro;
