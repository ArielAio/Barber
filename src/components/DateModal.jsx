import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    format, 
    addMonths, 
    subMonths, 
    isSunday, 
    isSameMonth, 
    isToday, 
    isPast,
    isFuture,
    set,
    startOfMonth,
    endOfMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function DateModal({ 
    showModal, 
    setShowModal, 
    currentMonth, 
    setCurrentMonth,
    selectedDate,
    handleDateSelect,
    generateCalendarDays
}) {
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowModal(false);
        }
    };

    const today = new Date();
    const twoMonthsFromNow = endOfMonth(addMonths(today, 2));

    const handlePrevMonth = () => {
        setCurrentMonth(prevMonth => {
            const newMonth = subMonths(prevMonth, 1);
            return newMonth >= startOfMonth(today) ? newMonth : prevMonth;
        });
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => {
            const newMonth = addMonths(prevMonth, 1);
            return newMonth <= twoMonthsFromNow ? newMonth : prevMonth;
        });
    };

    return (
        <AnimatePresence>
            {showModal && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleOverlayClick}
                >
                    <motion.div
                        className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Selecione a Data
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-800">
                                <FaTimes size={24} />
                            </button>
                        </div>
                        
                        <div>
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
                            <div className="grid grid-cols-7 gap-2">
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
                                    <div key={day} className="text-center font-semibold text-gray-600">{day}</div>
                                ))}
                                {generateCalendarDays().map((date, index) => {
                                    const isDisabled = isSunday(date) || isPast(set(date, { hours: 23, minutes: 59, seconds: 59 })) || date > twoMonthsFromNow;
                                    const isCurrentMonth = isSameMonth(date, currentMonth);
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => !isDisabled && handleDateSelect(date)}
                                            disabled={isDisabled}
                                            className={`p-2 rounded ${
                                                isDisabled
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : isCurrentMonth
                                                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-400'
                                            } ${isToday(date) ? 'ring-2 ring-blue-500' : ''}`}
                                        >
                                            {format(date, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default DateModal;
