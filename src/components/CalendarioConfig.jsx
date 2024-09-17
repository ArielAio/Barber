import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/pt-br';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import app from '../lib/firebase';
import Modal from './Modal';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

const messages = {
    today: 'Hoje',
    previous: 'Voltar',
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

    const fetchAgendamentos = async () => {
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
                id: doc.id
            };
        });
        setLocalEvents(agendamentosData);
    };

    useEffect(() => {
        fetchAgendamentos();
    }, []);

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

    return (
        <div>
            <Calendar
                localizer={localizer}
                messages={messages} // Traduções aplicadas
                events={localEvents}
                startAccessor="start"
                endAccessor="end"
                style={{
                    height: 500,
                    width: '100%',
                    backgroundColor: 'white',
                    color: '#333',
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                }}
                className="bg-white text-black rounded-lg border-none shadow-sm"
                defaultView="month"
                popup
                onSelectEvent={handleSelectEvent}
            />

            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    cliente={selectedCliente}
                />
            )}
        </div>
    );
};

export default CalendarioConfig;
