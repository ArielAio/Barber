// pages/user/agendamentos.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import app from '../../lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingSpinner from '../../components/LoadingSpinner';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaEdit, FaTrashAlt, FaChevronLeft, FaClock, FaArrowLeft, FaTimes } from 'react-icons/fa';
import { format, addDays, isSunday, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import moment from 'moment-timezone';
import DateTimeModal from '../../components/DateTimeModal';

function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentAgendamento, setRecentAgendamento] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [selectedAgendamento, setSelectedAgendamento] = useState(null);
  const [nome, setNome] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horario, setHorario] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore(app);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState('date');
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email); // Armazena o email do usuário

        try {
          const q = query(collection(db, 'agendamentos'), where('email', '==', user.email));
          const agendamentosSnapshot = await getDocs(q);
          const agendamentosList = agendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          agendamentosList.sort((a, b) => b.dataAgendamento.toDate() - a.dataAgendamento.toDate());
          setRecentAgendamento(agendamentosList[0]);
          setAgendamentos(agendamentosList);
        } catch (error) {
          console.error('Erro ao buscar agendamentos:', error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, db, router]);

  const generateHorarios = useCallback(async (date) => {
    if (!date) return;

    const start = 9; // 9:00
    const end = 18; // 18:00
    const interval = 30; // 30 minutes
    const generatedHorarios = [];

    for (let hour = start; hour < end; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        generatedHorarios.push(time);
      }
    }

    const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
    const agendamentos = agendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const availableHorarios = generatedHorarios.map(time => {
      const [hour, minute] = time.split(':');
      const dateTime = new Date(date);
      dateTime.setHours(parseInt(hour), parseInt(minute));

      const isOccupied = agendamentos.some(agendamento => {
        if (agendamento.id === selectedAgendamento.id) return false; // Exclude the current appointment
        const agendamentoDate = agendamento.dataAgendamento.toDate();
        return agendamentoDate.getTime() === dateTime.getTime();
      });

      return { time, isOccupied };
    });

    setHorarios(availableHorarios);
  }, [db, selectedAgendamento]);

  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = getDay(start);
    const previousMonthDays = Array(startDay).fill(null).map((_, index) => {
      return subDays(start, startDay - index);
    });
    return [...previousMonthDays.reverse(), ...days];
  };

  const handleEdit = (agendamento) => {
    setSelectedAgendamento(agendamento);
    setNome(agendamento.nome);
    setDataAgendamento(format(agendamento.dataAgendamento.toDate(), 'yyyy-MM-dd'));
    setHorario(format(agendamento.dataAgendamento.toDate(), 'HH:mm'));
    setShowModal(true);
    setModalStep('date');
    setCurrentMonth(agendamento.dataAgendamento.toDate());
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setDataAgendamento(format(date, 'yyyy-MM-dd'));
    setModalStep('time');
    generateHorarios(date);
  };

  const handleTimeSelect = (time) => {
    setHorario(time);
    setShowModal(false);
    setModalStep('date');
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => addDays(prevMonth, -30));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addDays(prevMonth, 30));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const selectedDate = new Date(`${dataAgendamento}T${horario}`);
    const now = new Date();

    if (selectedDate < now) {
      setFeedbackMessage('Não é possível agendar para uma data no passado.');
      return;
    }

    if (window.confirm('Tem certeza que deseja atualizar este agendamento?')) {
      try {
        const agendamentoRef = doc(db, 'agendamentos', selectedAgendamento.id);
        const timeZone = 'America/Sao_Paulo';
        const dataAgendamentoMoment = moment.tz(`${dataAgendamento} ${horario}`, timeZone).toDate();

        await updateDoc(agendamentoRef, {
          nome,
          dataAgendamento: dataAgendamentoMoment
        });
        setSelectedAgendamento(null);
        setNome('');
        setDataAgendamento('');
        setHorario('');
        setFeedbackMessage('Agendamento atualizado com sucesso!');
        // Atualiza a lista de agendamentos
        const updatedAgendamentosSnapshot = await getDocs(query(collection(db, 'agendamentos'), where('email', '==', userEmail)));
        const updatedAgendamentosList = updatedAgendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAgendamentos(updatedAgendamentosList);
      } catch (error) {
        console.error('Erro ao atualizar o agendamento:', error);
        setFeedbackMessage('Erro ao atualizar o agendamento.');
      }
    }
  };

  const handleCancel = async (agendamentoId) => {
    if (window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        const agendamentoRef = doc(db, 'agendamentos', agendamentoId);
        await deleteDoc(agendamentoRef);
        setFeedbackMessage('Agendamento cancelado com sucesso!');
        // Atualiza a lista de agendamentos
        const updatedAgendamentosSnapshot = await getDocs(query(collection(db, 'agendamentos'), where('email', '==', userEmail)));
        const updatedAgendamentosList = updatedAgendamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAgendamentos(updatedAgendamentosList);
      } catch (error) {
        console.error('Erro ao cancelar o agendamento:', error);
        setFeedbackMessage('Erro ao cancelar o agendamento.');
      }
    }
  };

  // Add this function to map service IDs to friendly names
  const getServiceName = (serviceId) => {
    const serviceNames = {
      corte_cabelo: 'Corte de Cabelo',
      corte_barba: 'Corte de Barba',
      corte_cabelo_barba: 'Corte de Cabelo e Barba'
    };
    return serviceNames[serviceId] || serviceId;
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
      setModalStep('date');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white min-h-screen flex flex-col items-center px-4 py-8">
      <motion.h1
        className="text-4xl font-bold mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Meus Agendamentos
      </motion.h1>

      {feedbackMessage && (
        <motion.div
          className="w-full max-w-lg bg-opacity-80 bg-green-500 p-4 rounded-lg shadow-lg mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {feedbackMessage}
        </motion.div>
      )}

      {recentAgendamento && (
        <motion.div
          className="w-full max-w-lg bg-opacity-80 bg-blue-800 p-6 rounded-lg shadow-lg mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FaCalendarAlt className="mr-2 text-blue-400" />
            Próximo Agendamento
          </h2>
          <p className="mb-2 text-lg"><strong>Nome:</strong> {recentAgendamento.nome}</p>
          <p className="mb-2 text-lg"><strong>Data e Hora:</strong> {format(recentAgendamento.dataAgendamento.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
          <p className="mb-2 text-lg"><strong>Serviço:</strong> {getServiceName(recentAgendamento.servico)}</p>
          <p className="mb-2 text-lg"><strong>Preço:</strong> {recentAgendamento.preco}</p>
        </motion.div>
      )}

      {selectedAgendamento && (
        <motion.div
          className="w-full max-w-lg bg-opacity-80 bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FaEdit className="mr-2 text-yellow-400" />
            Editar Agendamento
          </h2>
          <form onSubmit={handleUpdate}>
            <label htmlFor="nome" className="block text-lg">Nome:</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-2 w-full p-2 border border-gray-600 rounded bg-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dataAgendamento && horario ? `${format(new Date(dataAgendamento), 'dd/MM/yyyy')} às ${horario}` : 'Selecionar Data e Horário'}
            </button>
            <button
              type="submit"
              className="mt-4 mr-2 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={() => setSelectedAgendamento(null)}
              className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
          </form>
        </motion.div>
      )}

      <DateTimeModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalStep={modalStep}
        setModalStep={setModalStep}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        selectedDate={selectedDate}
        handleDateSelect={handleDateSelect}
        handleTimeSelect={handleTimeSelect}
        horarios={horarios}
        generateCalendarDays={generateCalendarDays}
      />

      <AnimatePresence>
        {agendamentos.length > 0 ? (
          <motion.ul
            className="w-full max-w-lg space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {agendamentos.map((agendamento) => (
              <motion.li
                key={agendamento.id}
                className="bg-opacity-80 bg-gray-800 p-4 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold mb-1">{agendamento.nome}</p>
                    <p className="text-sm text-gray-300">{format(agendamento.dataAgendamento.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                    <p className="text-sm text-gray-300">Serviço: {getServiceName(agendamento.servico)}</p>
                    <p className="text-sm text-gray-300">Preço: {agendamento.preco}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(agendamento)}
                      className="p-2 bg-yellow-500 rounded-full hover:bg-yellow-600 transition-colors"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleCancel(agendamento.id)}
                      className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      disabled={new Date(agendamento.dataAgendamento.toDate()) < new Date()}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <motion.p
            className="text-center text-gray-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Nenhum agendamento encontrado.
          </motion.p>
        )}
      </AnimatePresence>

      <Link href="/" className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all transform hover:scale-105">
        <FaChevronLeft className="inline-block mr-2" /> Voltar
      </Link>
    </div>
  );
}

export default Agendamentos;
