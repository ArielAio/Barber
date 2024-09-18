import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { FaUserCircle, FaBars } from 'react-icons/fa';

const AdminHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const menuRef = useRef(null); // Usado para detectar cliques fora do menu dropdown
    const navRef = useRef(null); // Usado para detectar cliques fora do menu mobile
    const router = useRouter();
    const auth = getAuth();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const toggleNav = () => {
        setNavOpen(!navOpen);
    };

    // Função para detectar cliques fora do menu e fechar
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
            if (navRef.current && !navRef.current.contains(event.target)) {
                setNavOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen, navOpen]);

    return (
        <header className="bg-gray-800 text-white shadow-md py-4 fixed w-full top-0 z-50">
            <div className="container mx-auto flex justify-between items-center px-4">
                <h1 className="text-2xl font-bold">
                    <Link href="/admin">Barbearia</Link>
                </h1>

                {/* Botão de hambúrguer para mobile */}
                <button
                    onClick={toggleNav}
                    className="lg:hidden text-white focus:outline-none"
                >
                    <FaBars size={24} />
                </button>

                {/* Menu para desktop */}
                <nav className={`lg:flex items-center space-x-4 hidden`}>
                    <Link href="/admin/dashboard" className="hover:text-blue-500 transition-colors">
                        Dashboard
                    </Link>
                    <Link href="/admin/agendamentos" className="hover:text-blue-500 transition-colors">
                        Agendamentos
                    </Link>

                    <div className="relative" ref={menuRef}>
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

                {/* Menu para mobile */}
                <div ref={navRef} className={`lg:hidden absolute top-16 left-0 w-full bg-gray-800 text-white shadow-lg ${navOpen ? 'block' : 'hidden'}`}>
                    <nav className="flex flex-col space-y-2 py-4 px-4">
                        <Link href="/admin/dashboard" className="hover:text-blue-500 transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/admin/agendamentos" className="hover:text-blue-500 transition-colors">
                            Agendamentos
                        </Link>
                        <div className="border-t border-gray-700 mt-2"></div>
                        <Link href="/conta" className="hover:text-blue-500 transition-colors">
                            Minha Conta
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-left hover:text-blue-500 transition-colors"
                        >
                            Sair
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
