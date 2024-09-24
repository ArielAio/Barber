import { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import translateFirebaseError from '../components/translateFirebaseError';
import app from '../lib/firebase';
import Link from 'next/link';
import { FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            if (!user.emailVerified) {
                setError('Por favor, verifique seu e-mail antes de fazer login.');
                return;
            }
            
            await redirectUser(user.uid);
        } catch (err) {
            setError(translateFirebaseError(err.code));
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Cria um documento de usuário no Firestore se não existir
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                await setDoc(docRef, {
                    username: user.displayName || user.email.split('@')[0],
                    email: user.email,
                    role: 'user',
                    emailVerified: user.emailVerified,
                });
            } else {
                // Update the emailVerified status
                await setDoc(docRef, { emailVerified: user.emailVerified }, { merge: true });
            }

            if (!user.emailVerified) {
                setError('Por favor, verifique seu e-mail antes de fazer login.');
                return;
            }

            await redirectUser(user.uid);
        } catch (err) {
            setError(translateFirebaseError(err.code));
        }
    };

    const redirectUser = async (userId) => {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (!userData.emailVerified) {
                setError('Por favor, verifique seu e-mail antes de fazer login.');
                return;
            }
            if (userData.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } else {
            setError('Documento do usuário não encontrado.');
        }
    };

    const buttonVariants = {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95 }
    };

    return (
        <motion.div 
            className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
        >
            <motion.div 
                className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="px-6 py-8 sm:px-8 sm:py-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <h2 className="text-center text-3xl font-extrabold text-blue-300 mb-2">
                            Faça seu login
                        </h2>
                        <p className="text-center text-sm text-blue-200 mb-6">
                            Entre para acessar sua conta
                        </p>
                    </motion.div>
                    
                    {error && (
                        <div className="bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-md mb-6" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    
                    <motion.form 
                        className="space-y-6" 
                        onSubmit={handleLogin}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email-address" className="sr-only">
                                    Endereço de e-mail
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Endereço de e-mail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                        placeholder="Senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <motion.button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                Entrar
                            </motion.button>
                        </div>
                    </motion.form>

                    <motion.div 
                        className="mt-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-gray-800 text-gray-300">Ou continue com</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <motion.button
                                onClick={handleGoogleSignIn}
                                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                            >
                                <FaGoogle className="w-5 h-5 mr-2" />
                                Google
                            </motion.button>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="mt-6 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <p className="text-sm text-blue-200">
                            Não tem uma conta?{' '}
                            <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
                                Crie uma conta
                            </Link>
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Login;
