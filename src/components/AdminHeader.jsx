import React, { useState } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { FaUserCircle } from 'react-icons/fa';

const AdminHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();
    const auth = getAuth();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <header className="bg-gray-800 text-white shadow-md py-4 fixed w-full top-0 z-50">
            <div className="container mx-auto flex justify-between items-center px-4">
                <h1 className="text-2xl font-bold">
                    <Link href="/admin">Barbearia</Link>
                </h1>

                <nav className="flex items-center space-x-4">
                    <Link href="/admin/dashboard" className="hover:text-blue-500 transition-colors">
                        Dashboard
                    </Link>
                    <Link href="/admin/agendamentos" className="hover:text-blue-500 transition-colors">
                        Agendamentos
                    </Link>

                    <div className="relative">
                        <button
                            onClick={toggleMenu}
                            className="flex items-center space-x-2 focus:outline-none"
                        >
                            <FaUserCircle size={24} />
                        </button>
                        <div className={`absolute right-0 mt-2 bg-white text-gray-900 rounded shadow-lg py-2 ${menuOpen ? 'block' : 'hidden'}`}>
                            <Link href="/conta" className="block px-4 py-2 hover:bg-gray-200">
                                Minha Conta
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default AdminHeader;
