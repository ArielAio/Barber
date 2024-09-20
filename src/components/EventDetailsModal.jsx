import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EventDetailsModal = ({ event, onClose }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-white">{event.title}</h3>
        <p className="text-white mb-2"><strong>Cliente:</strong> {event.userName}</p>
        <p className="text-white mb-2"><strong>Data:</strong> {format(event.start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        <p className="text-white mb-2"><strong>Horário:</strong> {format(event.start, "HH:mm")} - {format(new Date(event.start.getTime() + 30 * 60000), "HH:mm")}</p>
        <p className="text-white mb-4"><strong>Serviço:</strong> {event.title}</p>
        {event.price && <p className="text-white mb-4"><strong>Preço:</strong> R$ {event.price.toFixed(2)}</p>}
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default EventDetailsModal;
