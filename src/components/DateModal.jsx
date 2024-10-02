import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function DateModal({ showModal, setShowModal, handleDateSelect, initialDate }) {
    const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());

    useEffect(() => {
        if (showModal && initialDate) {
            setCurrentMonth(initialDate);
        }
    }, [showModal, initialDate]);

    const handlePrevMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    const generateCalendarDays = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        const firstDayOfWeek = getDay(start);
        for (let i = 1; i <= firstDayOfWeek; i++) {
            days.unshift(new Date(start.getFullYear(), start.getMonth(), -i + 1));
        }

        while (days.length % 7 !== 0) {
            days.push(new Date(end.getFullYear(), end.getMonth() + 1, days.length - end.getDate() + 1));
        }

        return days;
    };

    if (!showModal) return null;

    const calendarDays = generateCalendarDays();

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowModal(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={handlePrevMonth} className="text-blue-500 hover:text-blue-700">
                        <FaChevronLeft size={24} />
                    </button>
                    <h3 className="text-lg font-semibold text-gray-700">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <button onClick={handleNextMonth} className="text-blue-500 hover:text-blue-700">
                        <FaChevronRight size={24} />
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-center font-semibold text-gray-600">{day}</div>
                    ))}
                    {calendarDays.map((day, index) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isDisabled = isBefore(day, new Date()) && !isToday(day);
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (!isDisabled) {
                                        handleDateSelect(day);
                                        setShowModal(false);
                                    }
                                }}
                                className={`p-2 rounded-full ${
                                    isCurrentMonth
                                        ? isDisabled
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-800 hover:bg-blue-100'
                                        : 'text-gray-400'
                                } ${isToday(day) ? 'bg-blue-500 text-white' : ''}`}
                                disabled={isDisabled}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={() => setShowModal(false)}
                    className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
}

export default DateModal;
