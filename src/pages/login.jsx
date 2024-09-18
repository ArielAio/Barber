import { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import translateFirebaseError from '../components/translateFirebaseError';
import app from '../lib/firebase';

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
                    username: user.displayName || user.email.split('@')[0], // Usa o nome do Google ou o email sem domínio
                    email: user.email,
                    role: 'user',
                });
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
            if (userData.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } else {
            setError('Documento do usuário não encontrado.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-800">
            <div className="w-full max-w-md p-8 bg-gray-900 rounded shadow-lg">
                <h1 className="text-2xl text-white font-bold mb-6 text-center">Entrar</h1>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Seu email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border rounded-lg bg-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="password"
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border rounded-lg bg-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                        Entrar
                    </button>
                </form>
                <div className="my-6 text-center">
                    <p className="text-gray-400 mb-4">Ou entre com</p>
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full bg-red-500 text-white p-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                        Google
                    </button>
                </div>
                <div className="text-center mt-4">
                    <p className="text-gray-400">
                        Não tem uma conta?{' '}
                        <a href="/register" className="text-blue-500 hover:underline">
                            Crie uma conta
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
