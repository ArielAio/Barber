import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AdminHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [navOpen, setNavOpen] = useState(false);
    const menuRef = useRef(null);
    const navRef = useRef(null);
    const router = useRouter();
    const auth = getAuth();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const toggleNav = () => setNavOpen(!navOpen);

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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-gray-800 text-white shadow-md py-4 fixed w-full top-0 z-50">
            <div className="container mx-auto flex justify-between items-center px-4">
                <h1 className="text-2xl font-bold">
                    <Link href="/admin">Barbearia</Link>
                </h1>

                <button onClick={toggleNav} className="lg:hidden text-white focus:outline-none">
                    {navOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>

                <nav className="hidden lg:flex items-center space-x-4">
                    <Link href="/admin/dashboard" className="hover:text-blue-400 transition-colors">
                        Dashboard
                    </Link>
                    <Link href="/admin/agendamentos" className="hover:text-blue-400 transition-colors">
                        Agendamentos
                    </Link>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={toggleMenu}
                            className="flex items-center space-x-2 focus:outline-none hover:text-blue-400 transition-colors"
                        >
                            <FaUserCircle size={24} />
                        </button>
                        <AnimatePresence>
                            {menuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 bg-white text-gray-900 rounded shadow-lg py-2"
                                >
                                    <Link href="/conta" className="block px-4 py-2 hover:bg-gray-200 transition-colors">
                                        Minha Conta
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-200 transition-colors"
                                    >
                                        Sair
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>
            </div>

            <AnimatePresence>
                {navOpen && (
                    <motion.div
                        ref={navRef}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden absolute top-16 left-0 w-full bg-gray-800 shadow-lg"
                    >
                        <nav className="flex flex-col p-4 space-y-2">
                            <Link href="/admin/dashboard" className="py-2 hover:text-blue-400 transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/admin/agendamentos" className="py-2 hover:text-blue-400 transition-colors">
                                Agendamentos
                            </Link>
                            <div className="border-t border-gray-700 my-2"></div>
                            <Link href="/conta" className="py-2 hover:text-blue-400 transition-colors">
                                Minha Conta
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="py-2 text-left hover:text-blue-400 transition-colors"
                            >
                                Sair
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default AdminHeader;
