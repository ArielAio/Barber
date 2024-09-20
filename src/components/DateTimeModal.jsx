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
    startOfDay, 
    isAfter, 
    set, 
    isEqual, 
    parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaArrowLeft, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function DateTimeModal({ 
    showModal, 
    setShowModal, 
    modalStep, 
    setModalStep, 
    currentMonth, 
    setCurrentMonth,
    selectedDate,
    handleDateSelect,
    handleTimeSelect,
    horarios,
    generateCalendarDays,
    scheduledTimes,
    isLoadingHorarios // Add this new prop
}) {
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowModal(false);
            setModalStep('date');
        }
    };

    const handlePrevMonth = () => {
        setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
    };

    const isTimeScheduled = (date, time) => {
        const [hours, minutes] = time.split(':');
        const dateTime = set(date, { hours: parseInt(hours), minutes: parseInt(minutes) });
        return scheduledTimes.some(scheduledTime => 
            isEqual(parseISO(scheduledTime), dateTime)
        );
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
                                {modalStep === 'date' ? 'Selecione a Data' : 'Selecione o Horário'}
                            </h2>
                            <button onClick={() => {
                                if (modalStep === 'time') {
                                    setModalStep('date');
                                } else {
                                    setShowModal(false);
                                    setModalStep('date');
                                }
                            }} className="text-gray-600 hover:text-gray-800">
                                {modalStep === 'time' ? <FaArrowLeft size={24} /> : <FaTimes size={24} />}
                            </button>
                        </div>
                        
                        {modalStep === 'date' && (
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
                                        const isDisabled = isSunday(date) || isPast(set(date, { hours: 23, minutes: 59, seconds: 59 }));
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
                        )}
                        
                        {modalStep === 'time' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                    Horários disponíveis para {format(selectedDate, 'dd/MM/yyyy')}
                                </h3>
                                {isLoadingHorarios ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {horarios.map(({ time, isOccupied }) => {
                                            const [hours, minutes] = time.split(':');
                                            const dateTime = set(selectedDate, { hours: parseInt(hours), minutes: parseInt(minutes) });
                                            const now = new Date();
                                            const isPastTime = isPast(dateTime);
                                            const isScheduled = isTimeScheduled(selectedDate, time);
                                            const isDisabled = isOccupied || isPastTime || isScheduled;
                                            
                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => !isDisabled && handleTimeSelect(time)}
                                                    disabled={isDisabled}
                                                    className={`p-2 rounded ${
                                                        isDisabled
                                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                    }`}
                                                >
                                                    {time}
                                                    {(isOccupied || isScheduled) && <span className="ml-2">🔒</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default DateTimeModal;
