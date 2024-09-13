import React from 'react';
import Calendario from '../components/Calendario'; // Assuming Calendario component is in a separate file
import Link from 'next/link';

const CalendarioPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">

            <h1 className="text-center text-2xl font-bold text-white mb-4">Calendario</h1>
            <div className="w-full max-w-screen-sm p-4 bg-gray-900 rounded-lg shadow-lg">
                <Calendario />
            </div>
            <Link href="/" className="fixed bottom-4 left-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                Voltar
            </Link>
        </div>
    );
};

export default CalendarioPage;