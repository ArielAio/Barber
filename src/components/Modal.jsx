import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaEnvelope, FaCalendarAlt, FaClock, FaMoneyBillWave } from 'react-icons/fa';
import moment from 'moment';

const Modal = ({ isOpen, onClose, cliente }) => {
    if (!isOpen || !cliente) return null;

    const formatDate = (date) => {
        if (!date) return '';
        return moment(date.toDate()).format('DD/MM/YYYY');
    };

    const formatTime = (date) => {
        if (!date) return '';
        return moment(date.toDate()).format('HH:mm');
    };

    const getEndTime = (startDate) => {
        if (!startDate) return '';
        return moment(startDate.toDate()).add(30, 'minutes').format('HH:mm');
    };

    const backdrop = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    const modal = {
        hidden: {
            y: "-100vh",
            opacity: 0,
        },
        visible: {
            y: "0",
            opacity: 1,
            transition: {
                delay: 0.1,
                type: "spring",
                damping: 25,
                stiffness: 500,
            },
        },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    variants={backdrop}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
                        variants={modal}
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white">Detalhes do Agendamento</h2>
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition duration-150"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-3">
                                <FaUser className="text-gray-400" size={20} />
                                <p className="text-gray-800"><span className="font-semibold">Nome:</span> {cliente.nome}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaEnvelope className="text-gray-400" size={20} />
                                <p className="text-gray-800"><span className="font-semibold">Email:</span> {cliente.email}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaCalendarAlt className="text-gray-400" size={20} />
                                <p className="text-gray-800"><span className="font-semibold">Data:</span> {formatDate(cliente.dataAgendamento)}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaClock className="text-gray-400" size={20} />
                                <p className="text-gray-800">
                                    <span className="font-semibold">Horário:</span> {formatTime(cliente.dataAgendamento)} - {getEndTime(cliente.dataAgendamento)}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <FaMoneyBillWave className="text-gray-400" size={20} />
                                <p className="text-gray-800">
                                    <span className="font-semibold">Status de Pagamento:</span>{' '}
                                    <span className={`px-2 py-1 rounded-full text-sm ${
                                        cliente.statusPagamento === 'Pago' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                    }`}>
                                        {cliente.statusPagamento}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-100 px-6 py-4">
                            <button
                                onClick={onClose}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-150"
                            >
                                Fechar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
