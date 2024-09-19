import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const UserHeader = () => {
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

    const menuItems = [
        { href: '/', label: 'Início' },
        { href: '/user/agendamentos', label: 'Agendamentos' },
        { href: '/user/cadastro', label: 'Agendar' },
    ];

    return (
        <header className="bg-gray-800 text-white shadow-md py-4 fixed w-full top-0 z-50">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">
                    Barbearia
                </Link>

                <button onClick={toggleNav} className="lg:hidden text-white focus:outline-none">
                    {navOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>

                <nav className="hidden lg:flex items-center space-x-4">
                    {menuItems.map((item) => (
                        <Link key={item.href} href={item.href} className="hover:text-blue-400 transition-colors">
                            {item.label}
                        </Link>
                    ))}
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
                            {menuItems.map((item) => (
                                <Link key={item.href} href={item.href} className="py-2 hover:text-blue-400 transition-colors">
                                    {item.label}
                                </Link>
                            ))}
                            <div className="border-t border-gray-700 my-2"></div>
                            <Link href="/conta" className="py-2 hover:text-blue-400 transition-colors">
                                Minha Conta
                            </Link>
                            <button onClick={handleLogout} className="py-2 text-left hover:text-blue-400 transition-colors">
                                Sair
                            </button>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default UserHeader;
