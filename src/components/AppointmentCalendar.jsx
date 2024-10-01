import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment-timezone';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EventDetailsModal from './EventDetailsModal'; // Import the new component

// Update the localizer to use Portuguese
const localizer = momentLocalizer(moment);
localizer.formats.monthHeaderFormat = (date) => format(date, 'MMMM yyyy', { locale: ptBR });

const StyledCalendarWrapper = styled.div`
  .custom-calendar {
    .rbc-calendar {
      background-color: white;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    .rbc-header {
      background-color: #f3f4f6;
      color: #1f2937;
      padding: 0.75rem;
      font-weight: bold;
      font-size: 1rem;
    }
    .rbc-month-view, .rbc-time-view { border: none; }
    .rbc-day-bg { background-color: white; }
    .rbc-off-range-bg { background-color: #f3f4f6; }
    .rbc-today { background-color: #e5edff; }
    .rbc-event {
      background-color: #4caf50;
      border: none;
      padding: 2px 5px;
      margin-bottom: 2px;
    }
    .rbc-event-content { 
      font-size: 0.875rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .rbc-button-link { color: #1f2937; }
    .rbc-show-more {
      color: #3b82f6;
      font-weight: bold;
      background-color: transparent;
      padding: 2px 5px;
      margin-top: 2px;
    }
    .rbc-row-segment {
      padding: 2px 4px;
    }
  }

  @media (max-width: 768px) {
    .custom-calendar {
      .rbc-header {
        font-size: 0.875rem;
        padding: 0.5rem;
      }
      .rbc-event-content {
        font-size: 0.75rem;
      }
      .rbc-toolbar {
        flex-direction: column;
        align-items: flex-start;
      }
      .rbc-toolbar button {
        margin-bottom: 0.5rem;
      }
    }
  }
`;

const CALENDAR_MESSAGES = {
  next: "Próximo",
  previous: "Anterior",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  allDay: "Dia inteiro",
  work_week: "Semana de trabalho",
  yesterday: "Ontem",
  tomorrow: "Amanhã",
  noEventsInRange: "Não há eventos neste período.",
  showMore: total => `+${total} mais`
};

const CALENDAR_FORMATS = {
  monthHeaderFormat: (date) => format(date, 'MMMM yyyy', { locale: ptBR }),
  dayHeaderFormat: (date) => format(date, "EEEE, d 'de' MMMM", { locale: ptBR }),
  dayRangeHeaderFormat: ({ start, end }) =>
    `${format(start, "d 'de' MMMM", { locale: ptBR })} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`,
  agendaHeaderFormat: ({ start, end }) =>
    `${format(start, "d 'de' MMMM", { locale: ptBR })} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`,
  agendaDateFormat: (date) => format(date, "EEE, d 'de' MMM", { locale: ptBR }),
  agendaTimeFormat: (date) => format(date, 'HH:mm', { locale: ptBR }),
  agendaTimeRangeFormat: ({ start, end }) =>
    `${format(start, 'HH:mm', { locale: ptBR })} - ${format(end, 'HH:mm', { locale: ptBR })}`,
};

const AppointmentCalendar = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.status === 'Pendente' ? '#fbbf24' : '#4caf50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '0.875rem',
        padding: '2px 5px',
      }
    };
  };

  const CustomToolbar = ({ onNavigate, label, onView, views }) => (
    <div className="flex flex-col items-center mb-4 text-gray-800">
      <button onClick={() => onNavigate('TODAY')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-4">
        Hoje
      </button>
      <div className="flex flex-col sm:flex-row justify-between items-center w-full">
        <div className="flex items-center mb-2 sm:mb-0">
          <button onClick={() => onNavigate('PREV')} className="text-2xl font-bold text-blue-600 mr-2 hover:text-blue-700 transition-colors">
            <FaChevronLeft />
          </button>
          <span className="text-xl font-semibold mx-2">{label}</span>
          <button onClick={() => onNavigate('NEXT')} className="text-2xl font-bold text-blue-600 ml-2 hover:text-blue-700 transition-colors">
            <FaChevronRight />
          </button>
        </div>
        <div className="flex items-center mt-2 sm:mt-0">
          {views.map(name => (
            <button
              key={name}
              onClick={() => onView(name)}
              className={`px-3 py-1 mx-1 rounded-md transition-colors ${
                view === name ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {name === 'month' ? 'Mês' : name === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const CustomEvent = ({ event }) => {
    // Simplify the service name for calendar display
    const simplifiedService = event.title.includes('Cabelo') ? 'Cabelo' : 'Barba';

    return (
      <div className="text-xs leading-tight" title={`${event.title}`}>
        {simplifiedService}
      </div>
    );
  };

  const CustomDayPropGetter = (date) => {
    if (date.getDay() === 0 || date.getDay() === 6) {
      return {
        className: 'weekend-day',
        style: {
          backgroundColor: '#f3f4f6',
        },
      };
    }
    return {};
  };

  return (
    <StyledCalendarWrapper>
      <motion.div
        className="w-full bg-white p-6 rounded-lg shadow-lg mb-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6 flex items-center justify-center text-gray-800">
          <FaCalendarAlt className="mr-3 text-blue-600" />
          Calendário de Agendamentos
        </h2>
        <div className="h-[calc(100vh-200px)] custom-calendar">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={CALENDAR_MESSAGES}
            formats={CALENDAR_FORMATS}
            views={['month', 'week', 'day']}
            components={{
              toolbar: CustomToolbar,
              event: CustomEvent,
            }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            dayPropGetter={CustomDayPropGetter}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            popup
            showMultiDayTimes
          />
        </div>
      </motion.div>
      {selectedEvent && (
        <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </StyledCalendarWrapper>
  );
};

export default AppointmentCalendar;