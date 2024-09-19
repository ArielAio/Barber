import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/pt-br';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import app from '../lib/firebase';
import Modal from './Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const messages = {
    today: 'Hoje',
    previous: 'Anterior',
    next: 'Próximo',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Nenhum evento neste período.',
    showMore: total => `+ Ver mais (${total})`,
};

const CalendarioConfig = () => {
    const [localEvents, setLocalEvents] = useState([]);
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    const fetchAgendamentos = useCallback(async () => {
        const db = getFirestore(app);
        const agendamentosSnapshot = await getDocs(collection(db, 'agendamentos'));
        const agendamentosData = agendamentosSnapshot.docs.map(doc => {
            const data = doc.data();
            const start = new Date(data.dataAgendamento.toDate());
            const end = new Date(start.getTime() + 30 * 60000);
            return {
                title: data.nome,
                start: start,
                end: end,
                id: doc.id,
                status: data.statusPagamento
            };
        });
        setLocalEvents(agendamentosData);
    }, []);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const handleSelectEvent = async (event) => {
        const db = getFirestore(app);
        const clienteRef = doc(db, 'agendamentos', event.id);
        const clienteDoc = await getDoc(clienteRef);

        if (clienteDoc.exists()) {
            setSelectedCliente(clienteDoc.data());
            setIsModalOpen(true);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const eventStyleGetter = (event) => {
        let backgroundColor = '#3174ad';
        if (event.status === 'Pago') {
            backgroundColor = '#4caf50';
        } else if (event.status === 'Pendente') {
            backgroundColor = '#ff9800';
        }
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const CustomToolbar = ({ onNavigate, label }) => (
        <div className="rbc-toolbar">
            <span className="rbc-btn-group">
                <button type="button" onClick={() => onNavigate('PREV')}>
                    <FaChevronLeft />
                </button>
                <button type="button" onClick={() => onNavigate('TODAY')}>
                    <FaCalendarAlt />
                </button>
                <button type="button" onClick={() => onNavigate('NEXT')}>
                    <FaChevronRight />
                </button>
            </span>
            <span className="rbc-toolbar-label">{label}</span>
            <span className="rbc-btn-group">
                <button type="button" onClick={() => setView('month')}>Mês</button>
                <button type="button" onClick={() => setView('week')}>Semana</button>
                <button type="button" onClick={() => setView('day')}>Dia</button>
            </span>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-gray-100 rounded-lg shadow-lg"
        >
            <Calendar
                localizer={localizer}
                messages={messages}
                events={localEvents}
                startAccessor="start"
                endAccessor="end"
                style={{
                    height: 'calc(100vh - 100px)',
                    width: '100%',
                }}
                className="bg-white text-gray-800 rounded-lg border-none shadow-sm"
                views={['month', 'week', 'day']}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                popup
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                components={{
                    toolbar: CustomToolbar
                }}
            />

            <AnimatePresence>
                {isModalOpen && (
                    <Modal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        cliente={selectedCliente}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CalendarioConfig;
