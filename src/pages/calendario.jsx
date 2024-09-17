import React from 'react';
import CalendarioConfig from '../components/CalendarioConfig';
import Link from 'next/link';

const Calendario = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl text-white font-bold mb-4 text-center">Calendário de Agendamentos</h1>
            <div className="w-full max-w-screen-lg p-4 bg-gray-900 rounded-lg shadow-lg">
                <CalendarioConfig />
            </div>
            <Link href="/" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
};

export default Calendario;
