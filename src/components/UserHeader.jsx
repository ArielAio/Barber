import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const UserHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const router = useRouter();
    const auth = getAuth();

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { href: '/', label: 'Início' },
        { href: '/user/agendamentos', label: 'Agendamentos' },
        { href: '/user/cadastro', label: 'Agendar' },
        { href: '/conta', label: 'Minha Conta' },
    ];

    return (
        <header className="bg-gray-900 text-white shadow-md py-4 fixed w-full top-0 z-50">
            <div className="container mx-auto px-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">
                    Barbearia
                </Link>

                <nav className="hidden md:flex space-x-4">
                    {menuItems.map((item) => (
                        <Link key={item.href} href={item.href} className="hover:text-blue-400 transition-colors">
                            {item.label}
                        </Link>
                    ))}
                    <button onClick={handleLogout} className="hover:text-blue-400 transition-colors">
                        Sair
                    </button>
                </nav>

                <button onClick={toggleMenu} className="md:hidden text-white focus:outline-none">
                    {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full bg-gray-800 shadow-lg md:hidden"
                    >
                        <nav className="flex flex-col p-4">
                            {menuItems.map((item) => (
                                <Link key={item.href} href={item.href} className="py-2 hover:text-blue-400 transition-colors">
                                    {item.label}
                                </Link>
                            ))}
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
