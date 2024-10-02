import React from 'react';
import Link from 'next/link';

const UnauthenticatedHeader = () => {
  return (
    <header className="bg-gray-800 text-white shadow-md py-4 fixed w-full top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Barbearia
        </Link>
        <nav className="flex items-center space-x-4">
          <Link href="/login" className="hover:text-blue-400 transition-colors">
            Entrar
          </Link>
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Cadastrar
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default UnauthenticatedHeader;
