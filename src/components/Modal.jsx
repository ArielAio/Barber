// components/Modal.js
import React from 'react';
import { useRouter } from 'next/router';

const Modal = ({ isOpen, onClose, cliente }) => {
    const router = useRouter();

    if (!isOpen) return null;

    // Formata a data para exibir apenas a data
    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('pt-BR'); // Ajuste o local conforme necessário
    };

    // Formata a hora para exibir apenas a hora e minuto
    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); // Exibe apenas horas e minutos
    };

    // Calcula a data e hora final do atendimento (30 minutos após a data inicial)
    const getEndDate = (startDate) => {
        if (!startDate) return '';
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + 30); // Adiciona 30 minutos
        return endDate;
    };

    const startDate = cliente?.dataAgendamento?.toDate();
    const endDate = getEndDate(startDate);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75">
            <div className="bg-white text-black rounded-lg shadow-lg w-11/12 max-w-lg">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Detalhes do Cliente</h2>
                </div>
                <div className="p-4">
                    <p><strong>Nome:</strong> {cliente?.nome}</p>
                    <p><strong>Email:</strong> {cliente?.email}</p>
                    <p><strong>Data de Agendamento:</strong> {formatDate(startDate)}</p>
                    <p><strong>Horário de Agendamento:</strong> {formatTime(startDate)} - {formatTime(endDate)}</p>
                </div>
                <div className="p-4 border-t flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
