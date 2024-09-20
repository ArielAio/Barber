import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, set, isEqual, parseISO } from 'date-fns';
import { FaTimes } from 'react-icons/fa';

function TimeModal({ 
    showModal, 
    setShowModal, 
    selectedDate,
    handleTimeSelect,
    horarios,
    scheduledTimes,
    isLoadingHorarios
}) {
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowModal(false);
        }
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
                                Selecione o Horário
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-800">
                                <FaTimes size={24} />
                            </button>
                        </div>
                        
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
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default TimeModal;
