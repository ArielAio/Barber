import { useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db } from '../lib/firebase'; // Importa Firestore
import { doc, setDoc } from 'firebase/firestore'; // Para salvar dados no Firestore
import app from '../lib/firebase';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('O email fornecido não é válido.');
      return;
    }

    try {
      // Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Salva o status do usuário como 'user' no Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: 'user', // Define o status inicial como 'user'
      });

      // Redireciona para /admin/admin após a criação do usuário
      router.push('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Faz o login com o Google
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Verifica se o usuário já existe no Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: user.email,
        role: 'user', // Define o status inicial como 'user'
      }, { merge: true }); // Usa merge para não sobrescrever dados existentes

      router.push('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-lg">
        <h1 className="text-2xl text-black font-bold mb-6 text-center">Crie sua conta</h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full text-black p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full text-black p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Registrar
          </button>
        </form>
        <div className="my-6 text-center">
          <p className="text-gray-600 mb-4">Ou registre-se com</p>
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-red-500 text-white p-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Google
          </button>
        </div>
        <div className="text-center mt-4">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
